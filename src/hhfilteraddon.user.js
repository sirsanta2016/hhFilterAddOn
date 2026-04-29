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
    Dragon: [
      'Accuracy', 'Speed', 'Lifesteal', 'Destroy', 'Toxic',
      'Frost', 'Daze', 'Avenging', 'Stalwart'
    ],
    IG: [
      'Life', 'Offense', 'Defense', 'Critical Rate', 'Resistance',
      'Retaliation', 'Reflex', 'Cursed', 'Provoke'
    ],
    'Fire Knight': [
      'Fury', 'Curing', 'Immunity', 'Shield', 'Critical Damage',
      'Frenzy', 'Regeneration', 'Stun', 'Savage'
    ],
    Accessories: [
      'No Set Bonus', 'Slayer', 'Reaction', 'Protection', 'Bloodshield',
      'Stone Skin', 'Mercurial', 'Pinpoint', 'Revenge', 'Merciless',
      'Refresh', 'Feral', 'Supersonic', 'Stonecleaver'
    ],
    '9 pcs': [
      'Mercurial', 'Chronophage', 'Rebirth', 'Stonecleaver', 'Pinpoint',
      'Feral', 'Slayer', 'Merciless', 'Supersonic', 'Stone Skin', 'Protection'
    ],
    Forge: [
      'Swift Parry', 'Deflection', 'Resilience', 'Perception',
      'Affinitybreaker', 'Untouchable', 'Guardian', 'Fortitude',
      'Lethal', 'Instinct', 'Bolster', 'Defiant', 'Righteous', 'Slayer'
    ],
    Arena: [
      'Divine Critical Rate', 'Divine Life', 'Divine Offense', 'Divine Speed',
      'Zeal', 'Impulse'
    ],
    'Demon Lord': [
      'Immortal', 'Cruel'
    ],
    'Clan Shop': [
      'Killstroke'
    ],
    Tournament: [
      'Relentless'
    ],
    Hydra: [
      'Protection', 'Stone Skin'
    ]
  
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

  const supportButton = document.createElement("a");
  supportButton.textContent = "Support ☕";
  supportButton.href = "https://buymeacoffee.com/sirsanta2016";
  supportButton.target = "_blank";
  supportButton.rel = "noopener noreferrer";
  
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

  supportButton.addEventListener("mouseenter", () => {
    supportButton.style.opacity = "1";
    supportButton.style.transform = "scale(1.05)";
  });

  document.body.appendChild(supportButton);

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

  function addOverallRatingStyle() {
    if (document.getElementById('hh-addon-overall-rating-style')) return;

    const style = document.createElement('style');
    style.id = 'hh-addon-overall-rating-style';
style.textContent = `
  .hh-addon-overall-rating {
    margin-top: 4px;
    font-size: 12px;
    font-weight: 700;
    color: #ffd166;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 209, 102, 0.5);
    border-radius: 6px;
    padding: 3px 8px;
    width: fit-content;
    cursor: pointer;
  }

  .hh-addon-overall-rating:hover {
    background: rgba(255, 209, 102, 0.18);
  }

  .hh-addon-overall-rating:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  .hh-addon-overall-rating strong {
    color: #ffffff;
  }
`;

    document.head.appendChild(style);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function waitFor(fn, timeout = 10000, interval = 150) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const value = fn();
      if (value) return value;
      await sleep(interval);
    }

    return null;
  }

  function getOverlayPane() {
    return document.querySelector('.cdk-overlay-pane');
  }

  function hideActiveOverlay() {
    const pane = getOverlayPane();
    if (!pane) return;

    pane.dataset.tmPrevVisibility = pane.style.visibility || '';
    pane.dataset.tmPrevPointerEvents = pane.style.pointerEvents || '';
    pane.dataset.tmPrevOpacity = pane.style.opacity || '';

    pane.style.visibility = 'hidden';
    pane.style.pointerEvents = 'none';
    pane.style.opacity = '0';
  }

  function restoreActiveOverlay() {
    const pane = getOverlayPane();
    if (!pane) return;

    pane.style.visibility = pane.dataset.tmPrevVisibility || '';
    pane.style.pointerEvents = pane.dataset.tmPrevPointerEvents || '';
    pane.style.opacity = pane.dataset.tmPrevOpacity || '';

    delete pane.dataset.tmPrevVisibility;
    delete pane.dataset.tmPrevPointerEvents;
    delete pane.dataset.tmPrevOpacity;
  }

  function normText(elOrText) {
    const s = typeof elOrText === 'string' ? elOrText : (elOrText?.textContent || '');
    return s.replace(/\s+/g, ' ').trim();
  }

  function findFieldByLabel(labelText) {
    const fields = Array.from(document.querySelectorAll('mat-form-field'));
    return fields.find(field => normText(field.querySelector('mat-label')) === labelText) || null;
  }

  function getFieldTrigger(field) {
    return field?.querySelector('.mat-mdc-select-trigger, .mat-mdc-select');
  }

  function getFieldValueText(field) {
    return normText(field?.querySelector('.mat-mdc-select-value-text, .mat-mdc-select-min-line'));
  }

  function getOpenPanel() {
    return document.querySelector('[role="listbox"].mat-mdc-select-panel, .cdk-overlay-pane [role="listbox"]');
  }

  function getPanelOptions() {
    const panel = getOpenPanel();
    if (!panel) return [];
    return Array.from(panel.querySelectorAll('[role="option"].mat-mdc-option, mat-option[role="option"]'));
  }

  function getOptionLabel(option) {
    const primary = option?.querySelector('.mdc-list-item__primary-text');
    return normText(primary || option);
  }

  function isOptionSelected(option) {
    if (!option) return false;

    return (
      option.getAttribute('aria-selected') === 'true' ||
      option.classList.contains('mdc-list-item--selected') ||
      !!option.querySelector('.mat-pseudo-checkbox-checked')
    );
  }

function fireMouseSequence(el) {
  const events = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];

  for (const type of events) {
    el.dispatchEvent(new MouseEvent(type, {
      bubbles: true,
      cancelable: true
    }));
  }
}

  async function runDropdownOperationInvisible(operationFn) {
    try {
      await ensureAllDropdownsClosed();
      const result = await operationFn();
      return result;
    } finally {
      restoreActiveOverlay();
      await ensureAllDropdownsClosed();
    }
  }

  async function clearSelectedShowSetOptions() {
    await runDropdownOperationInvisible(async () => {
      await openDropdownByLabel(SHOW_SET_LABEL, true, true);
      await sleep(100);

      const options = getPanelOptions();

      for (const option of options) {
        if (!isOptionSelected(option)) continue;

        option.scrollIntoView({ block: 'center' });
        await sleep(40);

        fireMouseSequence(option);
        await sleep(140);

        if (isOptionSelected(option)) {
          const checkbox = option.querySelector('.mat-pseudo-checkbox');
          if (checkbox) {
            fireMouseSequence(checkbox);
            await sleep(140);
          }
        }

        if (isOptionSelected(option)) {
          const textNode = option.querySelector('.mdc-list-item__primary-text');
          if (textNode) {
            fireMouseSequence(textNode);
            await sleep(140);
          }
        }
      }
    });
  }

  async function ensureAllDropdownsClosed() {
    for (let i = 0; i < 4; i++) {
      if (!getOpenPanel()) break;

      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true
      }));

      await sleep(180);
    }
  }

  function hasHiddenShowSetOptions() {
    const options = getPanelOptions();
    return options.some(option => option.style.display === 'none');
  }

  function hasSelectedShowSetOptions() {
    const options = getPanelOptions();
    return options.some(option => isOptionSelected(option));
  }

  async function handleResetClick() {
    const mode = getCurrentMode();

    await openDropdownByLabel(SHOW_SET_LABEL, true);
    await sleep(120);

    const hidden = hasHiddenShowSetOptions();
    const selected = hasSelectedShowSetOptions();

    if (mode === MODE_ACCESSORIES) {
      if (hidden) {
        filterOptions(ARTIFACT_PRESETS.Accessories);
        await ensureAllDropdownsClosed();

        state.activePreset = null;
        state.phase = 'idle';
        return 'reset';
      }

      if (selected) {
        await ensureAllDropdownsClosed();
        await clearSelectedShowSetOptions();
        await enforceAccessoriesShowSetFilter();

        state.activePreset = null;
        state.phase = 'idle';
        return 'cleared';
      }

      await ensureAllDropdownsClosed();
      state.activePreset = null;
      state.phase = 'idle';
      return 'idle';
    }

    if (hidden) {
      resetOptionsVisibility();
      await ensureAllDropdownsClosed();

      state.activePreset = null;
      state.phase = 'idle';
      return 'reset';
    }

    if (selected) {
      await ensureAllDropdownsClosed();
      await clearSelectedShowSetOptions();

      state.activePreset = null;
      state.phase = 'idle';
      return 'cleared';
    }

    await ensureAllDropdownsClosed();
    state.activePreset = null;
    state.phase = 'idle';
    return 'idle';
  }

  async function openDropdownByField(field, forceReopen = false, invisible = false) {
    if (!field) throw new Error('Field not found');

    const trigger = getFieldTrigger(field);
    if (!trigger) throw new Error('Trigger not found');

    if (forceReopen || getOpenPanel()) {
      await ensureAllDropdownsClosed();
    }

    trigger.scrollIntoView({ block: 'center', inline: 'center' });
    await sleep(60);
    fireMouseSequence(trigger);

    const panel = await waitFor(() => getOpenPanel(), 5000);
    if (!panel) throw new Error('Dropdown panel did not open');

    await sleep(80);

    if (invisible) {
      hideActiveOverlay();
    }

    return panel;
  }

  async function closeDropdown() {
    await ensureAllDropdownsClosed();
  }

  async function selectSingleValueFromDropdown(label, valueText) {
    const field = await waitFor(() => findFieldByLabel(label), 10000);
    if (!field) throw new Error(`"${label}" field not found`);

    const currentValue = getFieldValueText(field);
    if (currentValue === valueText) return true;

    await openDropdownByField(field, true, true);
    await sleep(150);

    let option = getPanelOptions().find(opt =>
      normText(getOptionLabel(opt)).toLowerCase() === normText(valueText).toLowerCase()
    );

    if (!option) {
      const available = getPanelOptions().map(getOptionLabel);
      throw new Error(`Option "${valueText}" not found in "${label}". Available: ${available.join(', ')}`);
    }

    option.scrollIntoView({ block: 'center' });
    fireMouseSequence(option);
    await sleep(300);

    if (getOpenPanel()) {
      option = getPanelOptions().find(opt =>
        normText(getOptionLabel(opt)).toLowerCase() === normText(valueText).toLowerCase()
      );

      const textNode = option?.querySelector('.mdc-list-item__primary-text');
      if (textNode) {
        fireMouseSequence(textNode);
        await sleep(250);
      }
    }

    await ensureAllDropdownsClosed();
    return true;
  }

  async function forceAccessoriesListMode() {
    await selectSingleValueFromDropdown(MODE_LABEL, MODE_ACCESSORIES);
  }

  async function forceArtifactsListMode() {
    await selectSingleValueFromDropdown(MODE_LABEL, MODE_ARTIFACTS);
  }

  function filterOptions(allowedList) {
    const allowed = new Set(allowedList.map(v => normText(v).toLowerCase()));

    for (const option of getPanelOptions()) {
      const label = normText(getOptionLabel(option)).toLowerCase();
      option.style.display = allowed.has(label) ? '' : 'none';
    }

    const panel = getOpenPanel();
    if (panel) panel.scrollTop = 0;
  }

  function resetOptionsVisibility() {
    const options = getPanelOptions();

    for (const option of options) {
      option.style.display = '';
    }

    const panel = getOpenPanel();
    if (panel) panel.scrollTop = 0;
  }

  async function enforceAccessoriesShowSetFilter() {
    await openDropdownByLabel(SHOW_SET_LABEL, true);
    filterOptions(ARTIFACT_PRESETS.Accessories);
    await sleep(150);
    await ensureAllDropdownsClosed();
  }

  async function openDropdownByLabel(label, forceReopen = false, invisible = false) {
    const field = await waitFor(() => findFieldByLabel(label), 10000);
    if (!field) throw new Error(`"${label}" field not found`);
    return openDropdownByField(field, forceReopen, invisible);
  }

  async function ensureOptionSelected(option) {
    if (isOptionSelected(option)) return true;

    option.scrollIntoView({ block: 'center' });
    await sleep(60);

    fireMouseSequence(option);
    await sleep(220);
    if (isOptionSelected(option)) return true;

    const checkbox = option.querySelector('.mat-pseudo-checkbox');
    if (checkbox) {
      fireMouseSequence(checkbox);
      await sleep(220);
      if (isOptionSelected(option)) return true;
    }

    const textNode = option.querySelector('.mdc-list-item__primary-text');
    if (textNode) {
      fireMouseSequence(textNode);
      await sleep(220);
      if (isOptionSelected(option)) return true;
    }

    return isOptionSelected(option);
  }

  function getCurrentMode() {
    const field = findFieldByLabel(MODE_LABEL);
    if (!field) return MODE_ARTIFACTS;

    const value = getFieldValueText(field);
    return value === MODE_ACCESSORIES ? MODE_ACCESSORIES : MODE_ARTIFACTS;
  }

  async function selectAllVisibleOptionsForPreset(presetName) {
    const wanted = new Set(
      (ARTIFACT_PRESETS[presetName] || []).map(v => normText(v).toLowerCase())
    );

    await runDropdownOperationInvisible(async () => {
      await openDropdownByLabel(SHOW_SET_LABEL, true, true);
      filterOptions(ARTIFACT_PRESETS[presetName] || []);
      await sleep(100);

      const visible = getPanelOptions().filter(opt => {
        const label = normText(getOptionLabel(opt)).toLowerCase();
        return opt.style.display !== 'none' && wanted.has(label);
      });

      for (const option of visible) {
        if (!isOptionSelected(option)) {
          await ensureOptionSelected(option);
        }
      }
    });
  }

  async function handleArtifactPresetClick(presetName) {
    // await forceArtifactsListMode();

    const switchingPreset = state.activePreset !== presetName;

    if (switchingPreset) {
      await clearSelectedShowSetOptions();
    }

    if (state.activePreset !== presetName || state.phase !== 'filtered') {
      await openDropdownByLabel(SHOW_SET_LABEL, true);
      filterOptions(ARTIFACT_PRESETS[presetName] || []);
      state.activePreset = presetName;
      state.phase = 'filtered';
      return 'filtered';
    }

    await selectAllVisibleOptionsForPreset(presetName);
    state.phase = 'selected';
    return 'selected';
  }

  async function selectFactionFromShowFaction(factionName) {
    const SELECT_ID = 'mat-select-28';

    const field = await waitFor(() => findFieldByLabel(SHOW_FACTION_LABEL), 10000);
    if (!field) throw new Error(`"${SHOW_FACTION_LABEL}" field not found`);

    const currentValue = getFieldValueText(field);
    if (currentValue === factionName) return true;

    const panelId = await openSpecificSelectById(SELECT_ID);
    let options = getPanelOptionsByPanelId(panelId);

    let option = options.find(opt =>
      normText(getOptionLabel(opt)).toLowerCase() === normText(factionName).toLowerCase()
    );

    if (!option) {
      const available = options.map(getOptionLabel);
      await ensureAllDropdownsClosed();
      throw new Error(`Faction option not found: ${factionName}. Available: ${available.join(', ')}`);
    }

    option.scrollIntoView({ block: 'center' });
    await sleep(80);
    fireMouseSequence(option);
    await sleep(250);

    let updatedValue = getFieldValueText(field);
    if (updatedValue === factionName) {
      await ensureAllDropdownsClosed();
      return true;
    }

    options = getPanelOptionsByPanelId(panelId);
    option = options.find(opt =>
      normText(getOptionLabel(opt)).toLowerCase() === normText(factionName).toLowerCase()
    );

    const textNode = option?.querySelector('.mdc-list-item__primary-text');
    if (textNode) {
      fireMouseSequence(textNode);
      await sleep(250);
    }

    updatedValue = getFieldValueText(field);
    await ensureAllDropdownsClosed();

    if (updatedValue !== factionName) {
      throw new Error(`Failed to select faction "${factionName}". Current value: "${updatedValue}"`);
    }

    return true;
  }

  async function handleFactionButtonClick(factionName) {
    const previousMode = getCurrentMode();

    await forceAccessoriesListMode();
    await sleep(150);

    if (previousMode !== MODE_ACCESSORIES) {
      await enforceAccessoriesShowSetFilter();
      await sleep(150);
    }

    await ensureAllDropdownsClosed();
    await sleep(100);

    await selectFactionFromShowFaction(factionName);

    await ensureAllDropdownsClosed();
    state.activePreset = null;
    state.phase = 'idle';
    return 'selected';
  }

  function isArtifactsPage() {
    return location.pathname.startsWith('/artifacts');
  }

  function removeManagedButtons() {
    document.querySelectorAll('[data-tm-hardcoded-button="true"]').forEach(btn => btn.remove());
  }

  function wireResetButton(btn) {
    if (btn.dataset.tmWired === 'true') return;
    btn.dataset.tmWired = 'true';

    btn.addEventListener('click', async () => {
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.style.cursor = 'wait';

      try {
        const result = await handleResetClick();

        if (result === 'reset') {
          btn.textContent = 'Reset (2)';
        } else if (result === 'cleared') {
          btn.textContent = 'Cleared ✓';
        }

        await sleep(700);
      } catch (err) {
        console.error('[TM Hardcoded Presets] Failed to reset:', err);
        alert(err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
        btn.style.cursor = 'pointer';
      }
    });
  }

  function makeButton(id, text, bottom, background) {
    let btn = document.getElementById(id);
    if (btn) return btn;

    btn = document.createElement('button');
    btn.id = id;
    btn.dataset.tmHardcodedButton = 'true';
    btn.textContent = text;

    Object.assign(btn.style, {
      position: 'fixed',
      right: '20px',
      bottom: `${bottom}px`,
      zIndex: '999999',
      width: '150px',
      textAlign: 'center',
      padding: '10px 16px',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.25)',
      background,
      color: '#fff',
      fontSize: '13px',
      fontWeight: '700',
      cursor: 'pointer',
      boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
      opacity: '0.95'
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.03)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
    });

    document.body.appendChild(btn);
    return btn;
  }

  function wireArtifactPresetButton(btn, presetName) {
    if (btn.dataset.tmWired === 'true') return;
    btn.dataset.tmWired = 'true';

    btn.addEventListener('click', async () => {
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.style.cursor = 'wait';

      try {
        const result = await handleArtifactPresetClick(presetName);
        btn.textContent = result === 'filtered' ? `${presetName} (2)` : `${presetName} ✓`;
        await sleep(800);
      } catch (err) {
        console.error(`[TM Hardcoded Presets] Failed for ${presetName}:`, err);
        alert(err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
        btn.style.cursor = 'pointer';
      }
    });
  }

  function wireFactionButton(btn, factionName) {
    if (btn.dataset.tmWired === 'true') return;
    btn.dataset.tmWired = 'true';

    btn.addEventListener('click', async () => {
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.style.cursor = 'wait';

      try {
        await handleFactionButtonClick(factionName);
        btn.textContent = `${factionName} ✓`;
        await sleep(600);
      } catch (err) {
        console.error(`[TM Hardcoded Presets] Failed for faction ${factionName}:`, err);
        alert(err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
        btn.style.cursor = 'pointer';
      }
    });
  }

  function buildArtifactButtons() {
    let bottom = 20;
    const spacing = 50;

    for (const cfg of ARTIFACT_BUTTONS) {
      const id = `tm-${cfg.name.toLowerCase().replace(/\s+/g, '-')}-button`;
      const btn = makeButton(id, cfg.name, bottom, cfg.color);

      if (cfg.name === 'Reset') {
        wireResetButton(btn);
      } else {
        wireArtifactPresetButton(btn, cfg.name);
      }

      bottom += spacing;
    }
  }

  function buildFactionButtons() {
    for (const cfg of FACTION_BUTTONS) {
      const id = `tm-${cfg.name.toLowerCase().replace(/\s+/g, '-')}-button`;
      const btn = makeButton(id, cfg.name, cfg.bottom, cfg.color);
      wireFactionButton(btn, cfg.name);
    }
  }

  function getPanelOptionsByPanelId(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return [];
    return Array.from(panel.querySelectorAll('[role="option"].mat-mdc-option, mat-option[role="option"]'));
  }

  async function openSpecificSelectById(selectId) {
    await ensureAllDropdownsClosed();

    const selectEl = document.getElementById(selectId);
    if (!selectEl) throw new Error(`Select "${selectId}" not found`);

    selectEl.scrollIntoView({ block: 'center', inline: 'center' });
    await sleep(80);
    fireMouseSequence(selectEl);

    const panelId = `${selectId}-panel`;
    const panel = await waitFor(() => document.getElementById(panelId), 5000);
    if (!panel) throw new Error(`Panel "${panelId}" did not open`);

    await sleep(180);
    return panelId;
  }

  async function refreshButtonsForMode() {
    if (!isArtifactsPage()) {
      state.mode = null;
      state.activePreset = null;
      state.phase = 'idle';
      removeManagedButtons();
      await ensureAllDropdownsClosed();
      return;
    }

    const mode = getCurrentMode();
    if (state.mode === mode) return;

    state.mode = mode;
    state.activePreset = null;
    state.phase = 'idle';

    removeManagedButtons();

    if (mode === MODE_ACCESSORIES) {
      buildFactionButtons();
      await enforceAccessoriesShowSetFilter();
    } else {
      buildArtifactButtons();
      await ensureAllDropdownsClosed();
    }

    await ensureAllDropdownsClosed();
  }

  async function init() {
    await waitFor(() => document.body, 10000);
  
    addOverallRatingStyle();
    await ensureAllDropdownsClosed();
  
    if (isArtifactsPage()) {
      await refreshButtonsForMode();
    }
  
    if (isChampionsPage()) {
      await processChampionRatings();
    }
  
    setInterval(() => {
      if (isArtifactsPage()) {
        refreshButtonsForMode().catch(console.error);
      }
    
      if (isChampionsPage()) {
        processChampionRatings().catch(console.error);
      }
    }, 1200);
  }

  init();

  let lastUrl = location.href;
  const observer = new MutationObserver(async () => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      await sleep(800);
      state.mode = null;
      state.activePreset = null;
      state.phase = 'idle';
      await refreshButtonsForMode();
     if (isChampionsPage()) {
       await processChampionRatings();
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();