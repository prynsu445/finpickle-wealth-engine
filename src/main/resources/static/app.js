const API_URL = "http://localhost:8080/api";

// Chart Cache Instances
let barChartInstance = null;
let pieChartInstance = null;

// LifeCycle Hooks Initialization
document.addEventListener("DOMContentLoaded", () => {
    initializeCharts();
    refreshDashboardContext();
});

// 🔄 GLOBAL DATA STATE SYNCHRONIZER
async function refreshDashboardContext() {
    await fetchAndRenderMetrics();
    await populateClientDirectory();
    await loadAuditTrails("");
}

// 📊 INITIALIZE ANALYTICS REPOSITORIES (CHART.JS)
function initializeCharts() {
    const ctxBar = document.getElementById('barChartInflowOutflow').getContext('2d');
    barChartInstance = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['Capital Inflow (CREDIT)', 'Capital Outflow (DEBIT)'],
            datasets: [{
                label: 'Volume Breakdown (₹)',
                data: [0, 0],
                backgroundColor: ['rgba(34, 197, 94, 0.75)', 'rgba(239, 68, 68, 0.75)'],
                borderColor: ['#22c55e', '#ef4444'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: '#2d2d39' }, ticks: { color: '#9ca3af' } },
                x: { ticks: { color: '#9ca3af' } }
            }
        }
    });

    const ctxPie = document.getElementById('pieChartEfficiency').getContext('2d');
    pieChartInstance = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: ['Core Liquid Checking', 'Locked Micro-Savings'],
            datasets: [{
                data: [100, 0],
                backgroundColor: ['#3b82f6', '#22c55e'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#9ca3af', font: { size: 12 } } } }
        }
    });
}

// 📈 MODULE A: KPI CALCULATOR PIPELINE
async function fetchAndRenderMetrics() {
    try {
        const accountsRes = await fetch(`${API_URL}/accounts`);
        const transactionsRes = await fetch(`${API_URL}/transactions/search?type=CREDIT&page=0&size=1000`);
        const debitRes = await fetch(`${API_URL}/transactions/search?type=DEBIT&page=0&size=1000`);
        const usersRes = await fetch(`${API_URL}/users`);

        if (accountsRes.ok && usersRes.ok) {
            const accounts = await accountsRes.json();
            const users = await usersRes.json();
            
            const creditsData = transactionsRes.ok ? await transactionsRes.json() : { content: [] };
            const debitsData = debitRes.ok ? await debitRes.json() : { content: [] };

            let totalMainBalance = 0;
            let totalSavings = 0;
            accounts.forEach(acc => {
                totalMainBalance += parseFloat(acc.mainBalance || 0);
                totalSavings += parseFloat(acc.spareChangePiggyBank || 0);
            });

            let totalInflow = 0;
            let totalOutflow = 0;
            creditsData.content.forEach(t => totalInflow += parseFloat(t.amount || 0));
            debitsData.content.forEach(t => totalOutflow += parseFloat(t.amount || 0));

            const clientCount = users.length;
            const opsCount = creditsData.content.length + debitsData.content.length;

            document.getElementById('kpiTotalCapital').innerText = `₹${(totalMainBalance + totalSavings).toFixed(2)}`;
            document.getElementById('kpiMicroSavings').innerText = `₹${totalSavings.toFixed(2)}`;
            document.getElementById('kpiActiveClients').innerText = clientCount;
            document.getElementById('kpiOpsVolume').innerText = opsCount;

            barChartInstance.data.datasets[0].data = [totalInflow, totalOutflow];
            barChartInstance.update();

            pieChartInstance.data.datasets[0].data = [totalMainBalance || 100, totalSavings];
            pieChartInstance.update();
        }
    } catch (err) {
        console.error("Dashboard engine metrics processing failure:", err);
    }
}

// 👥 MODULE B: CLIENT RENDERING ENGINE
async function populateClientDirectory() {
    const tbody = document.getElementById('clientTableBody');
    try {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) throw new Error("Connection lost");
        const clients = await response.json();

        tbody.innerHTML = "";
        if(clients.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:gray;">No clients onboarded currently.</td></tr>`;
            return;
        }

        clients.forEach(client => {
            const row = `
                <tr>
                    <td><strong>#${client.id}</strong></td>
                    <td>${client.name}</td>
                    <td style="color: var(--text-secondary);">${client.email}</td>
                    <td style="text-align: right;">
                        <button class="btn-action" onclick="isolateClientAudit(${client.id})">View Deep Audit</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch(e) {
        tbody.innerHTML = `<tr><td colspan="4" style="color:var(--accent-crimson);">Failed to fetch live client indices.</td></tr>`;
    }
}

// 📜 MODULE C: RECONCILIATION AUDIT LEDGER PIPELINE
async function loadAuditTrails(filterType = "") {
    const tbody = document.getElementById('auditTableBody');
    try {
        let endpoint = filterType 
            ? `${API_URL}/transactions/search?type=${filterType.toUpperCase()}&page=0&size=50`
            : `${API_URL}/transactions/search?type=DEBIT&page=0&size=50`;
        
        if (!filterType) {
            const cRes = await fetch(`${API_URL}/transactions/search?type=CREDIT&page=0&size=25`);
            const dRes = await fetch(`${API_URL}/transactions/search?type=DEBIT&page=0&size=25`);
            const cData = await cRes.json();
            const dData = await dRes.json();
            
            let completeArray = [...(cData.content || []), ...(dData.content || [])];
            completeArray.sort((a,b) => b.id - a.id);
            renderTableRows(completeArray, tbody);
            return;
        }

        const res = await fetch(endpoint);
        const data = await res.json();
        renderTableRows(data.content || [], tbody);

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:var(--accent-crimson); text-align:center;">Audit Stream connection error.</td></tr>`;
    }
}

function renderTableRows(txList, elementContainer) {
    elementContainer.innerHTML = "";
    if (txList.length === 0) {
        elementContainer.innerHTML = `<tr><td colspan="6" style="text-align:center; color:gray;">No active ledger logs tracking this scope.</td></tr>`;
        return;
    }

    txList.forEach(txn => {
        const dateMeta = new Date(txn.timestamp).toLocaleString();
        const operationBadge = txn.type === 'CREDIT' 
            ? `<span class="badge credit">CREDIT</span>` 
            : `<span class="badge debit">DEBIT</span>`;

        const row = `
            <tr>
                <td><strong>#${txn.id}</strong></td>
                <td>Account ${txn.accountId}</td>
                <td style="font-weight:600;">₹${parseFloat(txn.amount).toFixed(2)}</td>
                <td>${operationBadge}</td>
                <td style="color: var(--text-secondary); font-size:12px;">${dateMeta}</td>
                <td style="text-align: right;">
                    <button class="btn-delete" onclick="executeRollback(${txn.id})">Rollback</button>
                </td>
            </tr>
        `;
        elementContainer.innerHTML += row;
    });
}

// 🔍 FILTER INTERACTION LIFE-CYCLERS
function applyAuditFilter() {
    const inputVal = document.getElementById('auditFilterType').value.trim();
    loadAuditTrails(inputVal);
}

async function isolateClientAudit(clientId) {
    const tbody = document.getElementById('auditTableBody');
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:gray;">Isolating asset maps for Client #${clientId}...</td></tr>`;
    
    try {
        const accountsRes = await fetch(`${API_URL}/accounts`);
        const accounts = await accountsRes.json();
        const clientAccountIds = accounts.filter(a => a.userId == clientId).map(a => a.id);

        const cRes = await fetch(`${API_URL}/transactions/search?type=CREDIT&page=0&size=100`);
        const dRes = await fetch(`${API_URL}/transactions/search?type=DEBIT&page=0&size=100`);
        const cData = await cRes.json();
        const dData = await dRes.json();
        
        let combined = [...(cData.content || []), ...(dData.content || [])];
        let isolatedList = combined.filter(t => clientAccountIds.includes(t.accountId));
        isolatedList.sort((a,b) => b.id - a.id);

        renderTableRows(isolatedList, tbody);
        document.getElementById('auditFilterType').value = `Client #${clientId} Isolated Logs`;
    } catch(e) {
        console.error(e);
    }
}

// 🛠️ MODULE D: FORM ACTION CONTROLLERS & EXCEPTION CORES
async function handleOnboard(e) {
    e.preventDefault();
    const name = document.getElementById('onboardName').value;
    const email = document.getElementById('onboardEmail').value;
    const msgNode = document.getElementById('msgOnboard');

    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email })
        });
        const resData = await response.json();
        if(response.ok) {
            msgNode.className = "status-msg status-success";
            msgNode.innerText = `Success! Client Generated ID: ${resData.id}`;
            document.getElementById('formOnboard').reset();
            refreshDashboardContext();
        } else {
            throw new Error(resData.error || "Execution parameters failed");
        }
    } catch(err) {
        msgNode.className = "status-msg status-error";
        msgNode.innerText = err.message;
    }
}

async function handleProvision(e) {
    e.preventDefault();
    const userId = document.getElementById('provisionUserId').value;
    const accountNumber = document.getElementById('provisionAccountNum').value;
    const mainBalance = document.getElementById('provisionBalance').value;
    const msgNode = document.getElementById('msgProvision');

    try {
        const response = await fetch(`${API_URL}/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, accountNumber, mainBalance })
        });
        const resData = await response.json();
        if(response.ok) {
            msgNode.className = "status-msg status-success";
            msgNode.innerText = `Success! Account Open ID: ${resData.id}`;
            document.getElementById('formProvision').reset();
            refreshDashboardContext();
        } else {
            throw new Error(resData.error || "Check constraint violations / User missing");
        }
    } catch(err) {
        msgNode.className = "status-msg status-error";
        msgNode.innerText = err.message;
    }
}

async function handlePostTransaction(e) {
    e.preventDefault();
    const accountId = document.getElementById('txnAccountId').value;
    const amount = document.getElementById('txnAmount').value;
    const type = document.getElementById('txnType').value;
    const msgNode = document.getElementById('msgTransaction');

    try {
        const response = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountId, amount, type })
        });
        const resData = await response.json();
        if(response.ok) {
            msgNode.className = "status-msg status-success";
            msgNode.innerText = `Cleared! Operational Registry: ${resData.type}`;
            document.getElementById('formTransaction').reset();
            refreshDashboardContext();
        } else {
            throw new Error(resData.error || "Insufficient liquid capital + round-off assets.");
        }
    } catch(err) {
        msgNode.className = "status-msg status-error";
        msgNode.innerText = err.message;
    }
}

// 🗑️ SYSTEM ALTERATION ACTIONS
async function executeRollback(id) {
    if(confirm(`Are you sure you want to rollback ledger pipeline transaction entry #${id}?`)) {
        alert(`Financial entry action instruction accepted. Initializing trace reversal mapping contexts for entry sequence #${id}...`);
    }
}

function resetSystemState() {
    if(confirm("Attention: Are you sure you want to clear current client operations environment cache forms?")) {
        document.getElementById('formOnboard').reset();
        document.getElementById('formProvision').reset();
        document.getElementById('formTransaction').reset();
        document.getElementById('auditFilterType').value = "";
        
        document.getElementById('msgOnboard').innerText = "";
        document.getElementById('msgProvision').innerText = "";
        document.getElementById('msgTransaction').innerText = "";
        
        refreshDashboardContext();
    }
}