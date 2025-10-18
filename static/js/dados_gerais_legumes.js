// static/js/dados_gerais_legumes.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dados Gerais Legumes - Inicializando...');
    
    // Inicializar gráfico de performance (excluindo TOTAL)
    initPerformanceChart();
    
    // Configurar eventos dos botões
    setupEventListeners();
    
    // Adicionar destaque ao carregar
    highlightTotalRow();
});

function initPerformanceChart() {
    const ctx = document.getElementById('chartPerformance');
    if (!ctx) {
        console.log('Canvas chartPerformance não encontrado');
        return;
    }
    
    // Pegar dados da tabela EXCLUINDO o TOTAL GERAL
    const tableRows = document.querySelectorAll('#tableGeral tr:not(.total-row)');
    const labels = [];
    const data = [];
    const backgroundColors = [];
    
    console.log(`Encontradas ${tableRows.length} linhas (excluindo TOTAL)`);

    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
            const nome = cells[0].textContent.trim();
            const variacaoText = cells[3].textContent.trim();
            const variacao = parseFloat(variacaoText.replace('%', '').replace('+', ''));
            
            if (!isNaN(variacao)) {
                labels.push(nome);
                data.push(variacao);
                
                // Definir cor baseada na variação
                if (variacao > 0) {
                    backgroundColors.push('rgba(5, 150, 105, 0.8)'); // Verde
                } else if (variacao < 0) {
                    backgroundColors.push('rgba(220, 38, 38, 0.8)'); // Vermelho
                } else {
                    backgroundColors.push('rgba(148, 163, 184, 0.8)'); // Cinza
                }
            }
        }
    });
    
    console.log(`Dados para gráfico: ${data.length} itens válidos`);
    
    if (data.length === 0) {
        showChartPlaceholder();
        return;
    }
    
    // Destruir gráfico anterior se existir
    if (window.performanceChart) {
        window.performanceChart.destroy();
    }
    
    window.performanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Variação (%)',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace('0.8', '1')),
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const symbol = value > 0 ? '+' : '';
                            return `Variação: ${symbol}${value}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 20
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function showChartPlaceholder() {
    const ctx = document.getElementById('chartPerformance');
    if (ctx) {
        ctx.parentElement.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-tertiary);">
                <i class="fas fa-chart-bar" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Gráfico de Performance</p>
                <small>Mostrando variações individuais dos legumes</small>
            </div>
        `;
    }
}

function setupEventListeners() {
    // Botão de exportação
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    // Botões de ordenação
    const sortNameBtn = document.getElementById('sortNameBtn');
    const sortTotalBtn = document.getElementById('sortTotalBtn');
    const sortVarBtn = document.getElementById('sortVarBtn');
    
    if (sortNameBtn) sortNameBtn.addEventListener('click', () => sortTable('name'));
    if (sortTotalBtn) sortTotalBtn.addEventListener('click', () => sortTable('total'));
    if (sortVarBtn) sortVarBtn.addEventListener('click', () => sortTable('var'));
    
    // Botões do gráfico
    const toggleViewBtn = document.getElementById('toggleViewBtn');
    const downloadChartBtn = document.getElementById('downloadChartBtn');
    
    if (toggleViewBtn) toggleViewBtn.addEventListener('click', toggleChartView);
    if (downloadChartBtn) downloadChartBtn.addEventListener('click', downloadChart);
}

function highlightTotalRow() {
    const totalRows = document.querySelectorAll('.total-row');
    totalRows.forEach(row => {
        row.style.animation = 'pulse 2s infinite';
    });
    
    // Adicionar CSS para animação
    if (!document.getElementById('highlight-styles')) {
        const style = document.createElement('style');
        style.id = 'highlight-styles';
        style.textContent = `
            @keyframes pulse {
                0% { background-color: rgba(30, 64, 175, 0.1); }
                50% { background-color: rgba(30, 64, 175, 0.2); }
                100% { background-color: rgba(30, 64, 175, 0.1); }
            }
            .total-row {
                border-left: 4px solid var(--primary) !important;
            }
        `;
        document.head.appendChild(style);
    }
}

function exportData() {
    try {
        const table = document.getElementById('tableGeral');
        let csv = [];
        
        // Cabeçalhos
        const headers = [];
        table.querySelectorAll('thead th').forEach(header => {
            headers.push(header.textContent.trim());
        });
        csv.push(headers.join(','));
        
        // Dados
        table.querySelectorAll('tbody tr').forEach(row => {
            const rowData = [];
            row.querySelectorAll('td').forEach(cell => {
                let text = cell.textContent.trim();
                // Remover emojis e formatar números
                text = text.replace(/[📊🔴🟢🟡]/g, '').trim();
                // Se for número com R$, limpar
                if (text.includes('R$')) {
                    text = text.replace('R$', '').trim();
                }
                // Se for porcentagem, limpar
                if (text.includes('%')) {
                    text = text.replace('%', '').trim();
                }
                rowData.push(`"${text}"`);
            });
            csv.push(rowData.join(','));
        });
        
        // Criar e baixar arquivo
        const csvContent = csv.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', 'dados_gerais_legumes.csv');  // ← MUDANÇA AQUI
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Feedback visual
        showNotification('Dados exportados com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar:', error);
        showNotification('Erro ao exportar dados', 'error');
    }
}

function sortTable(column) {
    const table = document.getElementById('tableGeral');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr:not(.total-row)'));
    const totalRow = tbody.querySelector('.total-row');
    
    // Determinar direção da ordenação
    const currentOrder = table.getAttribute('data-sort-order') || 'asc';
    const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    table.setAttribute('data-sort-order', newOrder);
    
    rows.sort((a, b) => {
        let aValue, bValue;
        
        switch(column) {
            case 'name':
                aValue = a.cells[0].textContent.trim();
                bValue = b.cells[0].textContent.trim();
                return newOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                
            case 'total':
                aValue = parseFloat(a.cells[1].textContent.replace('R$', '').trim());
                bValue = parseFloat(b.cells[1].textContent.replace('R$', '').trim());
                return newOrder === 'asc' ? aValue - bValue : bValue - aValue;
                
            case 'var':
                aValue = parseFloat(a.cells[3].textContent.replace('%', '').replace('+', '').trim());
                bValue = parseFloat(b.cells[3].textContent.replace('%', '').replace('+', '').trim());
                return newOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }
    });
    
    // Reordenar linhas (mantendo o TOTAL no final)
    rows.forEach(row => tbody.removeChild(row));
    rows.forEach(row => tbody.appendChild(row));
    if (totalRow) {
        tbody.appendChild(totalRow);
    }
    
    // Atualizar ícones dos botões
    updateSortIcons(column, newOrder);
    
    showNotification(`Tabela ordenada por ${column} (${newOrder})`, 'info');
}

function updateSortIcons(activeColumn, order) {
    // Resetar todos os ícones
    document.querySelectorAll('.table-btn i').forEach(icon => {
        icon.className = icon.className.replace(/fa-sort-(alpha|amount|numeric)-(down|up)/, 'fa-sort');
    });
    
    // Atualizar ícone ativo
    const activeBtn = document.querySelector(`[id$="${activeColumn}Btn"]`);
    if (activeBtn) {
        const icon = activeBtn.querySelector('i');
        let baseClass = '';
        
        switch(activeColumn) {
            case 'name': baseClass = 'alpha'; break;
            case 'total': baseClass = 'amount'; break;
            case 'var': baseClass = 'numeric'; break;
        }
        
        const direction = order === 'asc' ? 'down' : 'up';
        icon.className = `fas fa-sort-${baseClass}-${direction}`;
    }
}

function toggleChartView() {
    if (!window.performanceChart) return;
    
    const newType = window.performanceChart.config.type === 'bar' ? 'line' : 'bar';
    window.performanceChart.config.type = newType;
    window.performanceChart.update();
    
    showNotification(`Gráfico alterado para: ${newType}`, 'info');
}

function downloadChart() {
    if (!window.performanceChart) {
        showNotification('Nenhum gráfico disponível para download', 'warning');
        return;
    }
    
    const link = document.createElement('a');
    link.download = 'grafico_performance_legumes.png';  // ← MUDANÇA AQUI
    link.href = window.performanceChart.toBase64Image();
    link.click();
    
    showNotification('Gráfico baixado com sucesso!', 'success');
}

function showNotification(message, type = 'info') {
    // Remover notificação anterior
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    // Estilos da notificação
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function getNotificationColor(type) {
    const colors = {
        success: 'var(--success)',
        error: 'var(--danger)',
        warning: 'var(--warning)',
        info: 'var(--primary)'
    };
    return colors[type] || 'var(--primary)';
}

// Adicionar estilos de animação
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}