// ==UserScript==
// @name         HH Raid Optimiser – One-Click Filters (Presets + Factions)
// @namespace    https://github.com/sirsanta2016
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hellhades.com
// @version      1.1.0
// @description  Adds one-click preset filters and faction selectors to the HellHades Raid Optimiser, making artifact and accessory management faster and easier.
// @author       sirsanta2016
// @match        https://raidoptimiser.hellhades.com/*
// @run-at       document-idle
// @homepageURL  https://github.com/sirsanta2016/hhFilterAddOn
// @supportURL   https://github.com/sirsanta2016/hhFilterAddOn/issues
// @license      MIT
// @grant        GM_xmlhttpRequest
// @connect      hellhades.com
// ==/UserScript==

(function () {
  'use strict';

  const SHOW_SET_LABEL = 'Show set';
  const MODE_LABEL = 'Accessories/Artifacts';
  const SHOW_FACTION_LABEL = 'Show faction';

  const MODE_ARTIFACTS = 'Artifacts';
  const MODE_ACCESSORIES = 'Accessories';

  const ARTIFACT_PRESETS = {
    Dragon: ['Accuracy','Speed','Lifesteal','Destroy','Toxic','Frost','Daze','Avenging','Stalwart'],
    IG: ['Life','Offense','Defense','Critical Rate','Resistance','Retaliation','Reflex','Cursed','Provoke'],
    'Fire Knight': ['Fury','Curing','Immunity','Shield','Critical Damage','Frenzy','Regeneration','Stun','Savage'],
    Accessories: ['No Set Bonus','Slayer','Reaction','Protection','Bloodshield','Stone Skin','Mercurial','Pinpoint','Revenge','Merciless','Refresh','Feral','Supersonic','Stonecleaver'],
    '9 pcs': ['Mercurial','Chronophage','Rebirth','Stonecleaver','Pinpoint','Feral','Slayer','Merciless','Supersonic','Stone Skin','Protection'],
    Forge: ['Swift Parry','Deflection','Resilience','Perception','Affinitybreaker','Untouchable','Guardian','Fortitude','Lethal','Instinct','Bolster','Defiant','Righteous','Slayer'],
    Arena: ['Divine Critical Rate','Divine Life','Divine Offense','Divine Speed','Zeal','Impulse'],
    'Demon Lord': ['Immortal','Cruel'],
    'Clan Shop': ['Killstroke'],
    Tournament: ['Relentless'],
    Hydra: ['Protection','Stone Skin']
  };

  const ARTIFACT_BUTTONS = [
    { name: 'Dragon', color: '#8b0000' },
    { name: 'IG', color: '#1f5aa6' },
    { name: 'Fire Knight', color: '#7a4b00' },
    { name: 'Accessories', color: '#5a2d82' },
    { name: '9 pcs', color: '#2e8b57' },
    { name: 'Forge', color: '#b8860b' },
    { name: 'Arena', color: '#F5B027' },
    { name: 'Demon Lord', color: '#F54927' },
    { name: 'Clan Shop', color: '#4778D9' },
    { name: 'Tournament', color: '#3AD4BC' },
    { name: 'Hydra', color: '#f7d6184d' },
    { name: 'Reset', color: '#F74818' }
  ];

  const FACTION_BUTTONS = [
    { name: 'Argonites', bottom: 20, color: '#1f6f8b' },
    { name: 'Banner Lords', bottom: 70, color: '#7b1e1e' },
    { name: 'Barbarians', bottom: 120, color: '#7b3c1e' },
    { name: 'Dark Elves', bottom: 170, color: '#4a2a6b' },
    { name: 'Demonspawn', bottom: 220, color: '#6a1f55' },
    { name: 'Dwarves', bottom: 270, color: '#7a5a2a' },
    { name: 'High Elves', bottom: 320, color: '#1e4f7b' },
    { name: 'Knight Revenant', bottom: 370, color: '#5e5e5e' },
    { name: 'Lizardmen', bottom: 420, color: '#2c7b4f' },
    { name: 'Ogryn Tribes', bottom: 470, color: '#4a5c2a' },
    { name: 'Orcs', bottom: 520, color: '#2f6b2f' },
    { name: 'Shadowkin', bottom: 570, color: '#2a2a2a' },
    { name: 'Skinwalkers', bottom: 620, color: '#6b4d2e' },
    { name: 'Sylvan Watchers', bottom: 670, color: '#2d6a4f' },
    { name: 'The Sacred Order', bottom: 720, color: '#7b5a1e' },
    { name: 'Undead Hordes', bottom: 770, color: '#46506a' }
  ];

  const state = {
    activePreset: null,
    phase: 'idle',
    mode: null
  };

  const HH_RATING_CACHE = new Map();

  function isChampionsPage() {
    return location.pathname.startsWith('/champions');
  }

  function buildHellHadesSlugFromHero(heroRow) {
    const avatar = heroRow.querySelector('img.hero_avatar');

    if (avatar?.src) {
      const fileName = avatar.src.split('/').pop().replace('.png', '');

      return fileName
        .replace(/the([A-Z])/g, 'The$1')
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .toLowerCase();
    }

    const name = heroRow.querySelector('h3')?.textContent?.trim();
    if (!name) return null;

    return name
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function fetchHellHadesRating(slug) {
    if (HH_RATING_CACHE.has(slug)) {
      return Promise.resolve(HH_RATING_CACHE.get(slug));
    }

    const pageUrl = `https://hellhades.com/raid/champions/${slug}/`;

    return new Promise(resolve => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: pageUrl,
        onload: pageResponse => {
          const html = pageResponse.responseText;

          const championIdMatch = html.match(/wp-json\/wp\/v2\/champions\/(\d+)/i);
          const championId = championIdMatch ? championIdMatch[1] : null;

          console.log('[HH CHAMPION ID]', slug, championId);

          if (!championId) {
            HH_RATING_CACHE.set(slug, 'N/A');
            resolve('N/A');
            return;
          }

          const apiUrl = `https://hellhades.com/wp-json/hh-api/v3/raid/ratings/${championId}`;

          GM_xmlhttpRequest({
            method: 'GET',
            url: apiUrl,
            onload: ratingResponse => {
              try {
                const data = JSON.parse(ratingResponse.responseText);

                console.log('[HH API DATA]', slug, data);

                const ratingObject = Array.isArray(data)
                  ? data.find(item => item.form === '1') || data[0]
                  : data;

                const rawRating = Number(ratingObject?.overall_user);

                const rating = Number.isFinite(rawRating)
                  ? (rawRating / 2).toFixed(1)
                  : 'N/A';

                console.log('[HH FINAL]', slug, rating);

                HH_RATING_CACHE.set(slug, rating);
                resolve(rating);
              } catch (err) {
                console.log('[HH RATING PARSE ERROR]', slug, err);
                HH_RATING_CACHE.set(slug, 'N/A');
                resolve('N/A');
              }
            },
            onerror: err => {
              console.log('[HH RATING REQUEST ERROR]', slug, err);
              HH_RATING_CACHE.set(slug, 'N/A');
              resolve('N/A');
            }
          });
        },
        onerror: err => {
          console.log('[HH PAGE REQUEST ERROR]', slug, err);
          HH_RATING_CACHE.set(slug, 'N/A');
          resolve('N/A');
        }
      });
    });
  }

  // ... (rest of your file continues unchanged)
})();