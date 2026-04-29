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
// @license CC BY-NC 4.0 + Custom Terms
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
    { name: 'Dragon', color: '#303030' },
    { name: 'IG', color: '#303030' },
    { name: 'Fire Knight', color: '#303030' },
    { name: 'Accessories', color: '#303030' },
    { name: '9 pcs', color: '#303030' },
    { name: 'Forge', color: '#303030' },
    { name: 'Arena', color: '#303030' },
    { name: 'Demon Lord', color: '#303030' },
    { name: 'Clan Shop', color: '#303030' },
    { name: 'Tournament', color: '#303030' },
    { name: 'Hydra', color: '#303030' },
    { name: 'Reset', color: '#303030' }
  ];

  const FACTION_BUTTONS = [
    { name: 'Argonites', bottom: 20, color: '#303030' },
    { name: 'Banner Lords', bottom: 70, color: '#303030' },
    { name: 'Barbarians', bottom: 120, color: '#303030' },
    { name: 'Dark Elves', bottom: 170, color: '#303030' },
    { name: 'Demonspawn', bottom: 220, color: '#303030' },
    { name: 'Dwarves', bottom: 270, color: '#303030' },
    { name: 'High Elves', bottom: 320, color: '#303030' },
    { name: 'Knight Revenant', bottom: 370, color: '#303030' },
    { name: 'Lizardmen', bottom: 420, color: '#303030' },
    { name: 'Ogryn Tribes', bottom: 470, color: '#303030' },
    { name: 'Orcs', bottom: 520, color: '#303030' },
    { name: 'Shadowkin', bottom: 570, color: '#303030' },
    { name: 'Skinwalkers', bottom: 620, color: '#303030' },
    { name: 'Sylvan Watchers', bottom: 670, color: '#303030' },
    { name: 'The Sacred Order', bottom: 720, color: '#303030' },
    { name: 'Undead Hordes', bottom: 770, color: '#303030' }
  ];

  const supportButton = document.createElement('a');
  supportButton.textContent = 'Support ☕';
  supportButton.href = 'https://buymeacoffee.com/sirsanta2016';
  supportButton.target = '_blank';
  supportButton.rel = 'noopener noreferrer';

  supportButton.style.cssText = `
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 999999;
    background: #ffdd00;
    color: #111;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    opacity: 0.75;
    transition: opacity 0.2s ease, transform 0.15s ease;
  `;

  supportButton.addEventListener('mouseenter', () => {
    supportButton.style.opacity = '1';
    supportButton.style.transform = 'scale(1.05)';
  });

  function toggleSupportButton(show) {
    if (show) {
      if (!document.body.contains(supportButton)) {
        document.body.appendChild(supportButton);
      }
    } else {
      if (document.body.contains(supportButton)) {
        supportButton.remove();
      }
    }
  }

  const state = { activePreset: null, phase: 'idle', mode: null };
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

                const ratingObject = Array.isArray(data)
                  ? data.find(item => item.form === '1') || data[0]
                  : data;

                const rawRating = Number(ratingObject?.overall_user);
                const rating = Number.isFinite(rawRating)
                  ? (rawRating / 2).toFixed(1)
                  : 'N/A';

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

  function injectOverallRating(heroRow) {
    const titleContainer = heroRow.querySelector('.hero_title_container_left');
    if (!titleContainer) return;

    let button = heroRow.querySelector('.hh-addon-overall-rating');

    if (!button) {
      button = document.createElement('button');
      button.className = 'hh-addon-overall-rating';
      button.textContent = 'Load HH Overall ★';

      button.addEventListener('click', async event => {
        event.preventDefault();
        event.stopPropagation();

        const slug = buildHellHadesSlugFromHero(heroRow);
        if (!slug) return;

        button.disabled = true;
        button.textContent = 'Loading...';

        const rating = await fetchHellHadesRating(slug);

        button.innerHTML = `HH Overall: <strong>${rating}</strong> ★`;
        button.disabled = false;
      });

      titleContainer.appendChild(button);
    }
  }

  async function processChampionRatings() {
    if (!isChampionsPage()) return;

    const heroRows = document.querySelectorAll('app-hero.hero-row');

    for (const heroRow of heroRows) {
      if (heroRow.dataset.hhOverallRatingProcessed === 'true') continue;

      heroRow.dataset.hhOverallRatingProcessed = 'true';
      injectOverallRating(heroRow);
    }
  }

})();