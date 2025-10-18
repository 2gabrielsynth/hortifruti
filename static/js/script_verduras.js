// Aguarda a página carregar completamente
document.addEventListener('DOMContentLoaded', () => {
    
    // Elementos da UI
    const loadingElement = document.getElementById('loading');
    const kpiSection = document.getElementById('kpiSection');
    const chartsSection = document.getElementById('chartsSection');
    const tablesSection = document.getElementById('tablesSection');

    // Funções de formatação SEGURAS
    const fmtMoney = v => {
        const num = Number(v) || 0;
        return num.toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const fmtPct = v => {
        const num = Number(v) || 0;
        return (num > 0 ? '+' : '') + num.toFixed(2) + '%';
    };

    // FUNÇÃO PARA ATUALIZAR KPIs
    function updateKPIs(metricas) {
        // Faturamento Total
        const faturamentoElement = document.getElementById('faturamentoTotal');
        const trendFaturamento = document.getElementById('trendFaturamento');
        
        faturamentoElement.textContent = fmtMoney(metricas.faturamento_2025);
        
        if (metricas.variacao_faturamento < 0) {
            trendFaturamento.className = 'kpi-trend negative';
            trendFaturamento.innerHTML = `<i class="fas fa-arrow-down"></i> ${Math.abs(metricas.variacao_faturamento).toFixed(2)}% vs 2024`;
        } else {
            trendFaturamento.className = 'kpi-trend positive';
            trendFaturamento.innerHTML = `<i class="fas fa-arrow-up"></i> +${metricas.variacao_faturamento.toFixed(2)}% vs 2024`;
        }

        // Volume Total
        const volumeElement = document.getElementById('volumeTotal');
        const trendVolume = document.getElementById('trendVolume');
        
        volumeElement.textContent = (metricas.volume_2025 / 1000).toFixed(1) + 'K';
        
        if (metricas.variacao_volume < 0) {
            trendVolume.className = 'kpi-trend negative';
            trendVolume.innerHTML = `<i class="fas fa-arrow-down"></i> ${Math.abs(metricas.variacao_volume).toFixed(1)}% vs 2024`;
        } else {
            trendVolume.className = 'kpi-trend positive';
            trendVolume.innerHTML = `<i class="fas fa-arrow-up"></i> +${metricas.variacao_volume.toFixed(1)}% vs 2024`;
        }

        // Top Performer
        const topPerformerElement = document.getElementById('topPerformerNome');
        const trendTopPerformer = document.getElementById('trendTopPerformer');
        
        topPerformerElement.textContent = metricas.top_performer.nome;
        
        if (metricas.top_performer.variacao < 0) {
            trendTopPerformer.className = 'kpi-trend negative';
            trendTopPerformer.innerHTML = `<i class="fas fa-arrow-down"></i> ${Math.abs(metricas.top_performer.variacao).toFixed(2)}% vs 2024`;
        } else {
            trendTopPerformer.className = 'kpi-trend positive';
            trendTopPerformer.innerHTML = `<i class="fas fa-arrow-up"></i> +${metricas.top_performer.variacao.toFixed(2)}% vs 2024`;
        }
    }

    // Busca dados da API Flask PARA VERDURAS
    fetch('/api/verduras/dados')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(responseData => {
            const dados = responseData.dados;
            const metricas = responseData.metricas;

            // Esconde loading e mostra conteúdo
            loadingElement.style.display = 'none';
            kpiSection.style.display = 'flex';
            chartsSection.style.display = 'grid';
            tablesSection.style.display = 'block';

            // Validação crítica dos dados
            if (!dados || typeof dados !== 'object') {
                throw new Error('Dados inválidos da API');
            }

            // === ATUALIZA KPIs DINÂMICOS ===
            updateKPIs(metricas);

            // === PREENCHE TABELA TOP5 ===
            const tbodyTop5 = document.getElementById('tableTop5');
            if (dados.top5 && Array.isArray(dados.top5)) {
                tbodyTop5.innerHTML = ''; // Limpa conteúdo anterior
                
                dados.top5.forEach(r => {
                    const tr = document.createElement('tr');
                    const statusClass = r.var > 0 ? 'alta' : (r.var < 0 ? 'queda' : 'neutra');
                    const statusIcon = r.var > 0 ? '↗' : (r.var < 0 ? '↘' : '→');
                    
                    tr.innerHTML = `
                        <td>${r.nome || 'N/A'}</td>
                        <td>${fmtMoney(r.total)}</td>
                        <td>${fmtMoney(r.media)}</td>
                        <td class="${statusClass}">${fmtPct(r.var)}</td>
                        <td><span class="status-indicator ${statusClass}">${statusIcon}</span></td>
                    `;
                    tbodyTop5.appendChild(tr);
                });
            }

            // === GRÁFICO TOP5 - BARRAS ===
            if (dados.top5 && document.getElementById('chartTop5')) {
                const ctxTop5 = document.getElementById('chartTop5').getContext('2d');
                new Chart(ctxTop5, {
                    type: 'bar',
                    data: {
                        labels: dados.top5.map(d => d.nome),
                        datasets: [{
                            label: 'Média Mensal (R$)',
                            data: dados.top5.map(d => d.media || 0),
                            backgroundColor: (ctx) => {
                                const c = ctx.chart.ctx;
                                const gradient = c.createLinearGradient(0, 0, 0, 200);
                                gradient.addColorStop(0, 'rgba(0,176,255,0.85)');
                                gradient.addColorStop(1, 'rgba(0,230,118,0.85)');
                                return gradient;
                            },
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1,
                            borderRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `Média: ${fmtMoney(context.parsed.y)}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: { 
                                beginAtZero: true,
                                ticks: { color: '#9fb7c9' }, 
                                grid: { color: 'rgba(255,255,255,0.03)' } 
                            },
                            x: { 
                                ticks: { color: '#cfeafc' },
                                grid: { display: false }
                            }
                        }
                    }
                });
            }

            // === GRÁFICO HIGH - LINHA ===
            if (dados.high && document.getElementById('chartHigh')) {
                const ctxHigh = document.getElementById('chartHigh').getContext('2d');
                new Chart(ctxHigh, {
                    type: 'line',
                    data: {
                        labels: dados.high.map(d => d.nome),
                        datasets: [{
                            label: 'Total 2025 (R$)',
                            data: dados.high.map(d => d.total || 0),
                            fill: true,
                            tension: 0.35,
                            backgroundColor: 'rgba(0,176,255,0.08)',
                            borderColor: 'rgba(0,176,255,0.9)',
                            borderWidth: 2,
                            pointBackgroundColor: 'rgba(0,230,118,1)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 5
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `Total: ${fmtMoney(context.parsed.y)}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: { 
                                beginAtZero: true,
                                ticks: { color: '#9fb7c9' }, 
                                grid: { color: 'rgba(255,255,255,0.03)' } 
                            },
                            x: { 
                                ticks: { color: '#cfeafc' },
                                grid: { display: false }
                            }
                        }
                    }
                });
            }

            // === GRÁFICO POTENTIAL - DONUT ===
            if (dados.potential && document.getElementById('chartPotential')) {
                const ctxPotential = document.getElementById('chartPotential').getContext('2d');
                new Chart(ctxPotential, {
                    type: 'doughnut',
                    data: {
                        labels: dados.potential.map(d => d.nome),
                        datasets: [{
                            data: dados.potential.map(d => d.total || 0),
                            backgroundColor: ['#00b0ff', '#00e676', '#00bfa5', '#0077b6', '#00c3a7'],
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                            legend: { 
                                position: 'bottom', 
                                labels: { color: '#f55858ff', font: { size: 11 } } 
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `${context.label}: ${fmtMoney(context.parsed)}`;
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // === GRÁFICO LOW - DONUT ===
            if (dados.low && document.getElementById('chartLow')) {
                const ctxLow = document.getElementById('chartLow').getContext('2d');
                new Chart(ctxLow, {
                    type: 'doughnut',
                    data: {
                        labels: dados.low.map(d => d.nome),
                        datasets: [{
                            data: dados.low.map(d => d.total || 0),
                            backgroundColor: ['#ff6b6b', '#ff8a65', '#ff5252', '#ff1744', '#ff7043'],
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                            legend: { 
                                position: 'bottom', 
                                labels: { color: '#ff464fff', font: { size: 11 } } 
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `${context.label}: ${fmtMoney(context.parsed)}`;
                                    }
                                }
                            }
                        }
                    }
                });
            }

        })
        .catch(err => {
            console.error('Erro ao carregar dados:', err);
            loadingElement.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <span>Erro ao carregar dados: ${err.message}</span>
            `;
        });

    // === NAVEGAÇÃO ===
    document.querySelectorAll('.nav a').forEach((a) => {
        a.addEventListener('click', (e) => {
            if (a.getAttribute('href') === '#') {
                e.preventDefault(); // Previne navegação para links vazios
            }
            document.querySelectorAll('.nav a').forEach(x => x.classList.remove('active'));
            a.classList.add('active');
        });
    });

    // === REDIMENSIONAMENTO ===
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            Chart.helpers.each(Chart.instances, (chart) => {
                chart.resize();
                chart.update();
            });
        }, 250);
    });
});