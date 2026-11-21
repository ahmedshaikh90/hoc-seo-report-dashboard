(() => {
  const el = id => document.getElementById(id);
  const format = new Intl.NumberFormat('en-AE');
  async function get(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.json();
  }
  function state(id, label, tone, detail) {
    const badge = el(id + 'State');
    badge.textContent = label;
    badge.dataset.tone = tone;
    el(id + 'Detail').textContent = detail;
  }
  async function loadSources() {
    const [connection, archive] = await Promise.allSettled([
      get('data/monthly/connection-status.json'),
      get('data/monthly/index.json').then(async entries => {
        const latest = entries[0];
        if (!latest) throw new Error('Empty audit archive');
        const [report, links, keywords] = await Promise.all([
          get('data/monthly/' + latest.report),
          get('data/link-audits/' + latest.links),
          get('data/keyword-audits/' + latest.keywords)
        ]);
        return { report, links, keywords };
      })
    ]);
    if (archive.status === 'fulfilled') {
      const { links, keywords } = archive.value;
      state('archive', 'Available', 'ok', links.records.length + ' URL rows · ' + keywords.records.length + ' keywords');
    } else {
      state('archive', 'Load failed', 'warn', 'The published report or audit files could not be loaded.');
    }
    if (connection.status !== 'fulfilled') {
      state('gsc', 'Unavailable', 'warn', 'The last connection check could not be loaded.');
      state('ga', 'Unavailable', 'warn', 'The last connection check could not be loaded.');
      return;
    }
    const data = connection.value;
    state('ga', data.ga4.state === 'paused' ? 'Reads paused' : 'Unavailable', 'warn', data.ga4.detail);
    if (data.gsc.state !== 'available' || !data.gsc.rows.length) {
      state('gsc', 'Unavailable', 'warn', 'The last check returned no Search Console data.');
      return;
    }
    state('gsc', 'Read verified', 'ok', 'Checked ' + data.checkedDate + ' · final data through ' + data.gsc.end);
    const rows = data.gsc.rows;
    const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
    const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
    el('weeklyMetrics').textContent = format.format(clicks) + ' clicks · ' + format.format(impressions) + ' impressions';
    el('weeklyPeriod').textContent = data.gsc.start + ' to ' + data.gsc.end;
    const max = Math.max(1, ...rows.map(row => row.clicks));
    const chart = el('weeklyBars');
    chart.replaceChildren(...rows.map(row => {
      const bar = document.createElement('div');
      const count = document.createElement('span');
      const fill = document.createElement('b');
      const day = document.createElement('span');
      count.textContent = row.clicks;
      day.textContent = row.date.slice(-2);
      fill.style.height = (row.clicks / max * 62) + 'px';
      bar.setAttribute('aria-label', row.date + ', ' + row.clicks + ' clicks');
      bar.append(count, fill, day);
      return bar;
    }));
  }
  loadSources();
})();
