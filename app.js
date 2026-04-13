// ====== 数据存储 ======
const STORAGE_KEY = 'wechat_dashboard_data';

function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let dataset = loadData();

// ====== 表单提交 ======
document.getElementById('dataForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const entry = {
        id: Date.now(),
        date: document.getElementById('date').value,
        title: document.getElementById('articleTitle').value.trim(),
        reads: parseInt(document.getElementById('reads').value) || 0,
        likes: parseInt(document.getElementById('likes').value) || 0,
        shares: parseInt(document.getElementById('shares').value) || 0,
        recommendSource: parseInt(document.getElementById('recommendSource').value) || 0,
        completionRate: parseFloat(document.getElementById('completionRate').value) || 0,
        avgReadTime: parseInt(document.getElementById('avgReadTime').value) || 0,
        comments: parseInt(document.getElementById('comments').value) || 0,
        newFollowers: parseInt(document.getElementById('newFollowers').value) || 0,
        unfollowers: parseInt(document.getElementById('unfollowers').value) || 0,
        totalFollowers: parseInt(document.getElementById('totalFollowers').value) || 0,
    };
    dataset.push(entry);
    dataset.sort((a, b) => a.date.localeCompare(b.date));
    saveData(dataset);
    this.reset();
    refresh();
});

// ====== 示例数据 ======
document.getElementById('loadSampleBtn').addEventListener('click', function () {
    if (dataset.length > 0 && !confirm('加载示例数据会覆盖现有数据，确认继续？')) return;
    dataset = generateSampleData();
    saveData(dataset);
    refresh();
});

function generateSampleData() {
    const titles = [
        '如何高效学习编程', '2024年度总结', '深度解析AI趋势',
        '职场沟通技巧', '读书笔记：原则', '效率工具推荐',
        '周末随笔：生活感悟', '技术分享：前端新特性', '投资理财入门',
        '健康生活指南', '旅行攻略：云南', '美食推荐：家常菜',
        '摄影技巧分享', '心理学小知识', '年终盘点'
    ];
    const data = [];
    let followers = 5000;
    for (let i = 0; i < 15; i++) {
        const date = new Date(2024, 0, 1 + i * 7);
        const reads = Math.floor(Math.random() * 8000) + 1000;
        const likes = Math.floor(reads * (0.02 + Math.random() * 0.06));
        const shares = Math.floor(reads * (0.01 + Math.random() * 0.03));
        const recommendSource = Math.floor(reads * (0.3 + Math.random() * 0.5));
        const completionRate = parseFloat((20 + Math.random() * 60).toFixed(1));
        const avgReadTime = Math.floor(30 + Math.random() * 270);
        const cmts = Math.floor(reads * (0.003 + Math.random() * 0.01));
        const newF = Math.floor(Math.random() * 200) + 30;
        const unF = Math.floor(Math.random() * 50) + 5;
        followers += newF - unF;
        data.push({
            id: Date.now() + i,
            date: date.toISOString().slice(0, 10),
            title: titles[i],
            reads, likes, shares, recommendSource,
            completionRate, avgReadTime,
            comments: cmts,
            newFollowers: newF,
            unfollowers: unF,
            totalFollowers: followers,
        });
    }
    return data;
}

// ====== 清空数据 ======
document.getElementById('clearAllBtn').addEventListener('click', function () {
    if (!confirm('确认清空所有数据？此操作不可恢复。')) return;
    dataset = [];
    saveData(dataset);
    refresh();
});

// ====== 删除单条 ======
function deleteEntry(id) {
    dataset = dataset.filter(d => d.id !== id);
    saveData(dataset);
    refresh();
}

// ====== CSV 导出 ======
document.getElementById('exportBtn').addEventListener('click', function () {
    if (dataset.length === 0) { alert('没有数据可导出'); return; }
    const headers = ['日期', '标题', '阅读量', '点赞', '分享', '推荐来源', '完读率', '平均阅读时长', '评论', '新增关注', '取消关注', '总关注'];
    const keys = ['date', 'title', 'reads', 'likes', 'shares', 'recommendSource', 'completionRate', 'avgReadTime', 'comments', 'newFollowers', 'unfollowers', 'totalFollowers'];
    const bom = '\uFEFF';
    const csv = bom + headers.join(',') + '\n' + dataset.map(d =>
        keys.map(k => {
            const v = d[k];
            return typeof v === 'string' ? '"' + v.replace(/"/g, '""') + '"' : v;
        }).join(',')
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '公众号数据_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
});

// ====== CSV 导入 ======
document.getElementById('importFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        const text = ev.target.result.replace(/^\uFEFF/, '');
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) { alert('CSV 文件格式不正确'); return; }
        const newData = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            if (cols.length < 12) continue;
            newData.push({
                id: Date.now() + i,
                date: cols[0],
                title: cols[1],
                reads: parseInt(cols[2]) || 0,
                likes: parseInt(cols[3]) || 0,
                shares: parseInt(cols[4]) || 0,
                recommendSource: parseInt(cols[5]) || 0,
                completionRate: parseFloat(cols[6]) || 0,
                avgReadTime: parseInt(cols[7]) || 0,
                comments: parseInt(cols[8]) || 0,
                newFollowers: parseInt(cols[9]) || 0,
                unfollowers: parseInt(cols[10]) || 0,
                totalFollowers: parseInt(cols[11]) || 0,
            });
        }
        if (newData.length === 0) { alert('未能解析到有效数据'); return; }
        if (dataset.length > 0 && !confirm('导入将覆盖现有数据，确认继续？')) return;
        dataset = newData;
        dataset.sort((a, b) => a.date.localeCompare(b.date));
        saveData(dataset);
        refresh();
        alert('成功导入 ' + newData.length + ' 条数据');
    };
    reader.readAsText(file);
    this.value = '';
});

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') {
                current += '"';
                i++;
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                result.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
    }
    result.push(current.trim());
    return result;
}

// ====== 数字格式化 ======
function fmt(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    return n.toLocaleString('zh-CN');
}

function fmtTime(seconds) {
    if (seconds >= 60) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return s > 0 ? m + '分' + s + '秒' : m + '分';
    }
    return seconds + '秒';
}

// ====== 刷新所有视图 ======
const chartInstances = {};

function refresh() {
    const hasData = dataset.length > 0;
    document.getElementById('overviewSection').style.display = hasData ? '' : 'none';
    document.getElementById('chartsSection').style.display = hasData ? '' : 'none';
    document.getElementById('tableSection').style.display = hasData ? '' : 'none';
    if (!hasData) return;

    updateOverview();
    updateTable();
    updateCharts();
}

function updateOverview() {
    const n = dataset.length;
    const totalReads = dataset.reduce((s, d) => s + d.reads, 0);
    const totalLikes = dataset.reduce((s, d) => s + d.likes, 0);
    const totalShares = dataset.reduce((s, d) => s + d.shares, 0);
    const totalComments = dataset.reduce((s, d) => s + d.comments, 0);
    const avgCompletionRate = (dataset.reduce((s, d) => s + d.completionRate, 0) / n).toFixed(1);
    const avgReadTime = Math.round(dataset.reduce((s, d) => s + d.avgReadTime, 0) / n);
    const totalInteraction = totalLikes + totalShares + totalComments;
    const avgEng = totalReads > 0 ? ((totalInteraction / totalReads) * 100).toFixed(1) : 0;
    const netF = dataset.reduce((s, d) => s + d.newFollowers - d.unfollowers, 0);

    document.getElementById('totalArticles').textContent = n;
    document.getElementById('totalReads').textContent = fmt(totalReads);
    document.getElementById('avgReads').textContent = fmt(Math.round(totalReads / n));
    document.getElementById('totalLikes').textContent = fmt(totalLikes);
    document.getElementById('avgEngagement').textContent = avgEng + '%';
    document.getElementById('avgCompletionRate').textContent = avgCompletionRate + '%';
    document.getElementById('avgReadTimeCard').textContent = fmtTime(avgReadTime);
    document.getElementById('netFollowers').textContent = (netF >= 0 ? '+' : '') + fmt(netF);
}

function updateTable() {
    const tbody = document.getElementById('dataTableBody');
    tbody.innerHTML = dataset.map(d => `
        <tr>
            <td>${d.date}</td>
            <td>${escapeHtml(d.title)}</td>
            <td>${fmt(d.reads)}</td>
            <td>${fmt(d.likes)}</td>
            <td>${fmt(d.shares)}</td>
            <td>${fmt(d.recommendSource)}</td>
            <td>${d.completionRate}%</td>
            <td>${fmtTime(d.avgReadTime)}</td>
            <td>${fmt(d.comments)}</td>
            <td>${fmt(d.newFollowers)}</td>
            <td>${fmt(d.unfollowers)}</td>
            <td>${fmt(d.totalFollowers)}</td>
            <td><button class="delete-btn" onclick="deleteEntry(${d.id})">删除</button></td>
        </tr>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateCharts() {
    const labels = dataset.map(d => d.date);
    const green = '#07c160';
    const blue = '#1890ff';
    const orange = '#fa8c16';
    const purple = '#722ed1';
    const red = '#e74c3c';
    const cyan = '#13c2c2';

    // 1. 阅读量趋势
    renderChart('readsChart', 'line', {
        labels,
        datasets: [{
            label: '阅读量',
            data: dataset.map(d => d.reads),
            borderColor: green,
            backgroundColor: 'rgba(7,193,96,0.1)',
            fill: true,
            tension: 0.3,
        }]
    });

    // 2. 互动数据趋势
    renderChart('engagementChart', 'line', {
        labels,
        datasets: [
            { label: '点赞', data: dataset.map(d => d.likes), borderColor: blue, tension: 0.3 },
            { label: '分享', data: dataset.map(d => d.shares), borderColor: orange, tension: 0.3 },
            { label: '评论', data: dataset.map(d => d.comments), borderColor: cyan, tension: 0.3 },
        ]
    });

    // 3. 粉丝增长趋势
    renderChart('followersChart', 'bar', {
        labels,
        datasets: [
            { label: '新增关注', data: dataset.map(d => d.newFollowers), backgroundColor: 'rgba(7,193,96,0.7)' },
            { label: '取消关注', data: dataset.map(d => -d.unfollowers), backgroundColor: 'rgba(231,76,60,0.7)' },
        ]
    }, {
        plugins: { legend: { position: 'top' } },
        scales: {
            x: { stacked: true },
            y: { stacked: true }
        }
    });

    // 4. 互动类型分布饼图
    const totalLikesChart = dataset.reduce((s, d) => s + d.likes, 0);
    const totalSharesChart = dataset.reduce((s, d) => s + d.shares, 0);
    const totalCommentsChart = dataset.reduce((s, d) => s + d.comments, 0);
    renderChart('engagementPieChart', 'doughnut', {
        labels: ['点赞', '分享', '评论'],
        datasets: [{
            data: [totalLikesChart, totalSharesChart, totalCommentsChart],
            backgroundColor: [blue, orange, cyan],
        }]
    }, {
        plugins: { legend: { position: 'bottom' } }
    });

    // 4b. 完读率趋势
    renderChart('completionRateChart', 'line', {
        labels,
        datasets: [{
            label: '完读率 (%)',
            data: dataset.map(d => d.completionRate),
            borderColor: purple,
            backgroundColor: 'rgba(114,46,209,0.1)',
            fill: true,
            tension: 0.3,
        }]
    }, {
        scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } }
    });

    // 4c. 平均阅读时长趋势
    renderChart('avgReadTimeChart', 'bar', {
        labels,
        datasets: [{
            label: '平均阅读时长 (秒)',
            data: dataset.map(d => d.avgReadTime),
            backgroundColor: 'rgba(24,144,255,0.6)',
        }]
    }, {
        scales: { y: { beginAtZero: true, ticks: { callback: v => v + 's' } } }
    });

    // 5. 文章阅读量排行
    const sorted = [...dataset].sort((a, b) => b.reads - a.reads).slice(0, 10);
    renderChart('topArticlesChart', 'bar', {
        labels: sorted.map(d => d.title.length > 10 ? d.title.slice(0, 10) + '…' : d.title),
        datasets: [{
            label: '阅读量',
            data: sorted.map(d => d.reads),
            backgroundColor: 'rgba(7,193,96,0.7)',
        }]
    }, {
        indexAxis: 'y',
        plugins: { legend: { display: false } }
    });

    // 6. 互动率分析
    const engRates = dataset.map(d => {
        const total = d.likes + d.shares + d.comments;
        return d.reads > 0 ? parseFloat(((total / d.reads) * 100).toFixed(2)) : 0;
    });
    renderChart('engagementRateChart', 'bar', {
        labels,
        datasets: [{
            label: '互动率 (%)',
            data: engRates,
            backgroundColor: engRates.map(r => r > 5 ? 'rgba(7,193,96,0.7)' : r > 3 ? 'rgba(250,140,22,0.7)' : 'rgba(231,76,60,0.5)'),
        }]
    }, {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: v => v + '%' } } }
    });
}

function renderChart(canvasId, type, data, extraOptions) {
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }
    const ctx = document.getElementById(canvasId).getContext('2d');
    chartInstances[canvasId] = new Chart(ctx, {
        type,
        data,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: { intersect: false, mode: 'index' },
            ...extraOptions
        }
    });
}

// ====== 初始化 ======
(function init() {
    // 设置默认日期为今天
    document.getElementById('date').valueAsDate = new Date();
    refresh();
})();
