(() => {
  const reportRoot = 'data/monthly/';
  const linksRoot = 'data/link-audits/';
  const keywordsRoot = 'data/keyword-audits/';
  const $ = id => document.getElementById(id);
  const statuses = ['Verified Live', 'Team Claims Live', 'Broken / Not Live', 'Not Verified'];
  const fmt = value => value == null ? 'Unavailable' : String(value);
  const link = (url, label) => {
    const target = safeUrl(url?.startsWith('data/') ? new URL(url, document.baseURI).href : url);
    return target
    ? '<a href="' + esc(target) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + '</a>'
    : esc(label);
  };
  const get = async url => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.json();
  };
  const options = (values, all) =>
    '<option value="">' + esc(all) + '</option>' +
    values.map(value => '<option>' + esc(value) + '</option>').join('');
  const statusClass = status => status === statuses[0] ? 'live' : status === statuses[2] ? 'broken' : 'unverified';
  const card = (label, value) => '<div class="card"><small>' + esc(label) + '</small><strong>' + esc(value) + '</strong></div>';

  async function openSnapshot(snapshot) {
    const [audit, keywords] = await Promise.all([
      get(linksRoot + snapshot.links),
      get(keywordsRoot + snapshot.keywords)
    ]);
    $('auditTotals').innerHTML = statuses.map(status => card(status, audit.summary[status] ?? 0)).join('');
    $('auditScope').textContent = audit.records.length + ' source rows · ' + audit.uniqueOriginalUrls +
      ' distinct report URLs · ' + audit.uniqueUrlsChecked + ' distinct URLs checked including earlier placement URLs';
    $('auditScope').textContent += '. Status totals reconcile both sources. Expand Original report for the result on the exact URL supplied.';
    $('auditCategory').innerHTML = options([...new Set(audit.records.map(row => row.category))], 'All categories');
    $('auditStatus').innerHTML = options(statuses, 'All statuses');
    $('auditArchives').innerHTML = [
      link(reportRoot + snapshot.report, 'Original monthly report data'),
      link(linksRoot + snapshot.links, 'URL evidence JSON'),
      link(keywordsRoot + snapshot.keywords, 'Keyword snapshot JSON'),
      link(keywordsRoot + '2026-11-21.json', 'Earlier Search Console snapshot')
    ].join(' · ');
    const analytics = snapshot.referrals ? await get('data/analytics/' + snapshot.referrals).catch(() => null) : null;
    const referrals = new Map(analytics?.publishers.map(row => [row.domain, row]) || []);
    $('auditGa4').textContent = analytics
      ? 'GA4 publisher referrals · ' + analytics.period.startDate + ' to ' + analytics.period.endDate +
        '. Sessions and key events apply to the whole publisher domain. Article-level leads require separate attribution. No source row means GA4 did not return that domain in this report.'
      : audit.ga4.reason + ' Sessions and leads are unavailable for this snapshot.';
    $('auditKeywordMethod').textContent = keywords.method;
    $('auditKeywordTotals').innerHTML = [
      card('November GSC matches', keywords.summary.matched),
      card('GSC improved vs October', keywords.summary.improved),
      card('GSC declined vs October', keywords.summary.declined),
      card('Team improved / declined', keywords.summary.teamImproved + ' / ' + keywords.summary.teamDeclined)
    ].join('');
    const renderLinks = () => {
      const category = $('auditCategory').value;
      const status = $('auditStatus').value;
      const term = $('auditSearch').value.trim().toLowerCase();
      const rows = audit.records.filter(row => (!category || category === row.category) &&
        (!status || status === row.status) &&
        [row.name, row.category, ...row.evidence.map(item => item.url)].join(' ').toLowerCase().includes(term));
      $('auditShowing').textContent = rows.length + ' rows shown';
      $('auditLinkRows').innerHTML = rows.map(row => '<tr><td>' + esc(row.name) +
        '<br><small>' + esc(row.category) + ' · row ' + row.row + '</small></td><td>' + esc(row.teamStatus) +
        '</td><td class="status ' + statusClass(row.status) + '">' + esc(row.status) + '</td><td>' +
        row.evidence.map(item => '<details><summary>' + esc(item.variant) + ' · ' +
          esc(item.httpStatus ? 'HTTP ' + item.httpStatus : 'No HTTP response') + '</summary><div>' +
          link(item.url, item.url) + (item.finalUrl && item.finalUrl !== item.url
            ? '<br>Final URL · ' + link(item.finalUrl, item.finalUrl) : '') +
          '<p>' + esc(item.status + ' · ' + item.note) + '</p><small>' + esc(item.checkedAt || '') + '</small>' +
          (item.error ? '<p>' + esc(item.error) + '</p>' : '') +
          (item.backlinks?.length ? '<ul>' + item.backlinks.map(a => '<li>' + link(a.url, a.text || a.url) +
            (a.rel.length ? ' (' + esc(a.rel.join(', ')) + ')' : '') + '</li>').join('') + '</ul>' : '') +
          '</div></details>').join('') +
        (row.previousAudit ? '<details><summary>Previous audit</summary><p>' +
          esc(row.previousAudit.checkedDate + ' · ' + row.previousAudit.note) + '</p></details>' : '') +
        '</td></tr>').join('') || '<tr><td colspan="4">No matching rows.</td></tr>';
    };
    $('auditGuestRows').innerHTML = audit.records.filter(row => row.category.includes('Guest Post')).map(row => {
      const hostname = new URL(row.evidence[0].url).hostname;
      const referral = referrals.get(hostname.replace(/^www\./, '').toLowerCase());
      const articles = row.evidence.filter(item => item.status === statuses[0] && item.backlinks?.length);
      return '<tr><td>' + link(row.evidence[0].url, hostname) + '</td><td>' +
        esc(row.category) + '</td><td>' + (articles.length ? articles.map(item =>
          link(item.url, item.backlinks.length + ' HOC anchor record(s)')).join(', ') : esc(row.status)) +
        '</td><td>' + esc(analytics && referral?.sessions == null ? 'No source row' : fmt(referral?.sessions ?? row.sessions)) + '</td><td>' + esc(fmt(referral?.keyEvents)) + '</td><td>' + esc(fmt(row.leads)) + '</td></tr>';
    }).join('');
    const renderKeywords = () => {
      const term = $('auditKeywordSearch').value.trim().toLowerCase();
      const state = $('auditKeywordFilter').value;
      const rows = keywords.records.filter(row => row.keyword.toLowerCase().includes(term) &&
        (!state || (state === 'missing' ? !row.gsc.nov.position : row.gscMovement === state)));
      $('auditKeywordRows').innerHTML = rows.map(row => {
        const positions = ['sep', 'oct', 'nov'].map(month => {
          const item = row.gsc[month];
          return item.position == null ? esc(item.status) :
            esc(item.position.toFixed(1)) + '<br><small>' + item.clicks + ' clicks · ' + item.impressions + ' impressions</small>';
        });
        return '<tr><td>' + esc(row.keyword) + '</td><td>' + [row.sep, row.oct, row.nov].map(esc).join(' → ') +
          '</td><td>' + positions.join('</td><td>') + '</td><td>' + esc(row.gscMovement) +
          (row.gscChange == null ? '' : ' (' + esc(row.gscChange.toFixed(1)) + ')') +
          '</td><td>' + esc(row.novGap == null ? 'Unavailable' : row.novGap.toFixed(1)) + '</td></tr>';
      }).join('') || '<tr><td colspan="7">No matching keywords.</td></tr>';
    };
    for (const id of ['auditCategory', 'auditStatus', 'auditSearch']) $(id).oninput = renderLinks;
    for (const id of ['auditKeywordSearch', 'auditKeywordFilter']) $(id).oninput = renderKeywords;
    renderLinks();
    renderKeywords();
  }

  async function init() {
    const snapshots = await get(reportRoot + 'index.json');
    $('auditSnapshot').innerHTML = snapshots.map((snapshot, index) =>
      '<option value="' + index + '">' + esc(snapshot.label) + '</option>').join('');
    const load = () => openSnapshot(snapshots[Number($('auditSnapshot').value)]).catch(showError);
    $('auditSnapshot').onchange = load;
    await load();
  }
  function showError(error) {
    $('auditScope').textContent = 'Could not load audit snapshot · ' + error.message;
  }
  init().catch(showError);
})();
