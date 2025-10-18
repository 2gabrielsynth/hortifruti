// Dados Gerais - Script Principal
class DadosGeraisDashboard {
    constructor() {
        this.dadosConsolidados = {
            frutas: null,
            legumes: null,
            verduras: null
        };
        this.init();
    }

    async init() {
        await this.carregarDados();
        this.calcularConsolidado();
        this.renderizarKPIs();
        this.criarGraficos();
        this.renderizarTabela();
        this.configurarEventos();
        
        // Esconder loading
        document.getElementById('loadingState').classList.add('hidden');
    }

    async carregarDados() {
        try {
            const [frutas, legumes, verduras] = await Promise.all([
                this.fetchDados('/api/dados'),
                this.fetchDados('/api/legumes/dados'),
                this.fetchDados('/api/verduras/dados')
            ]);

            this.dadosConsolidados = { frutas, legumes, verduras };
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.mostrarErro('Erro ao carregar dados consolidados');
        }
    }

    async fetchDados(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    calcularConsolidado() {
        const { frutas, legumes, verduras } = this.dadosConsolidados;
        
        if (!frutas || !legumes || !verduras) return;

        // Calcular totais consolidados
        this.totais = {
            faturamento_2025: frutas.metricas.faturamento_2025 + legumes.metricas.faturamento_2025 + verduras.metricas.faturamento_2025,
            faturamento_2024: frutas.metricas.faturamento_2024 + legumes.metricas.faturamento_2024 + verduras.metricas.faturamento_2024,
            volume_2025: frutas.metricas.volume_2025 + legumes.metricas.volume_2025 + verduras.metricas.volume_2025,
            volume_2024: frutas.metricas.volume_2024 + legumes.metricas.volume_2024 + verduras.metricas.volume_2024
        };

        // Calcular variações
        this.totais.variacao_faturamento = ((this.totais.faturamento_2025 - this.totais.faturamento_2024) / this.totais.faturamento_2024) * 100;
        this.totais.variacao_volume = ((this.totais.volume_2025 - this.totais.volume_2024) / this.totais.volume_2024) * 100;

        // Encontrar top performer global
        this.topPerformerGlobal = this.encontrarTopPerformerGlobal();
    }

    encontrarTopPerformerGlobal() {
        const todosPerformers = [
            this.dadosConsolidados.frutas.metricas.top_performer,
            this.dadosConsolidados.legumes.metricas.top_performer,
            this.dadosConsolidados.verduras.metricas.top_performer
        ];

        return todosPerformers.reduce((top, current) => 
            current.variacao > top.variacao ? current : top
        );
    }

    renderizarKPIs() {
        // Faturamento Total
        document.getElementById('faturamento-total').textContent = 
            `R$ ${(this.totais.faturamento_2025 / 1000).toFixed(1)}K`;
        
        const trendFat = this.totais.variacao_faturamento >= 0 ? 'positive' : 'negative';
        document.getElementById('trend-faturamento').className = `kpi-trend ${trendFat}`;
        document.getElementById('variacao-faturamento').textContent = 
            `${this.totais.variacao_faturamento >= 0 ? '+' : ''}${this.totais.variacao_faturamento.toFixed(1)}% vs 2024`;

        // Volume Total
        document.getElementById('volume-total').textContent = 
            `${(this.totais.volume_2025 / 1000).toFixed(1)}K t`;
        
        const trendVol = this.totais.variacao_volume >= 0 ? 'positive' : 'negative';
        document.getElementById('trend-volume').className = `kpi-trend ${trendVol}`;
        document.getElementById('variacao-volume').textContent = 
            `${this.totais.variacao_volume >= 0 ? '+' : ''}${this.totais.variacao_volume.toFixed(1)}% vs 2024`;

        // Top Performer
        document.getElementById('top-performer-nome').textContent = this.topPerformerGlobal.nome;
        document.getElementById('top-performer-variacao').textContent = 
            `+${this.topPerformerGlobal.variacao.toFixed(1)}%`;
    }

    criarGraficos() {
        this.criarGraficoCategorias();
        this.criarGraficoTop5Global();
    }

    criarGraficoCategorias() {
        const ctx = document.getElementById('categoriasChart').getContext('2d');
        const faturamentos = [
            this.dadosConsolidados.frutas.metricas.faturamento_2025,
            this.dadosConsolidados.legumes.metricas.faturamento_2025,
            this.dadosConsolidados.verduras.metricas.faturamento_2025
        ];

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Frutas', 'Legumes', 'Verduras'],
                datasets: [{
                    data: faturamentos,
                    backgroundColor: ['#1e40af', '#3b82f6', '#60a5fa'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#e2e8f0',
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `R$ ${(value/1000).toFixed(1)}K (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    criarGraficoTop5Global() {
        const ctx = document.getElementById('top5GlobalChart').getContext('2d');
        
        // Combinar top 5 de todas as categorias
        const todosTop5 = [
            ...this.dadosConsolidados.frutas.dados.top5.map(p => ({...p, categoria: 'Frutas'})),
            ...this.dadosConsolidados.legumes.dados.top5.map(p => ({...p, categoria: 'Legumes'})),
            ...this.dadosConsolidados.verduras.dados.top5.map(p => ({...p, categoria: 'Verduras'}))
        ];

        // Ordenar por faturamento e pegar top 5 global
        const top5Global = todosTop5
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: top5Global.map(p => p.nome),
                datasets: [{
                    label: 'Faturamento 2025 (R$)',
                    data: top5Global.map(p => p.total),
                    backgroundColor: '#1e40af',
                    borderColor: '#1e3a8a',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e2e8f0'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            callback: function(value) {
                                return 'R$ ' + (value/1000).toFixed(0) + 'K';
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }

    renderizarTabela() {
        const tbody = document.getElementById('tabelaResumo');
        const categorias = [
            {
                nome: 'Frutas',
                faturamento: this.dadosConsolidados.frutas.metricas.faturamento_2025,
                variacao: this.dadosConsolidados.frutas.metricas.variacao_faturamento,
                volume: this.dadosConsolidados.frutas.metricas.volume_2025,
                topProduto: this.dadosConsolidados.frutas.metricas.top_performer.nome
            },
            {
                nome: 'Legumes',
                faturamento: this.dadosConsolidados.legumes.metricas.faturamento_2025,
                variacao: this.dadosConsolidados.legumes.metricas.variacao_faturamento,
                volume: this.dadosConsolidados.legumes.metricas.volume_2025,
                topProduto: this.dadosConsolidados.legumes.metricas.top_performer.nome
            },
            {
                nome: 'Verduras',
                faturamento: this.dadosConsolidados.verduras.metricas.faturamento_2025,
                variacao: this.dadosConsolidados.verduras.metricas.variacao_faturamento,
                volume: this.dadosConsolidados.verduras.metricas.volume_2025,
                topProduto: this.dadosConsolidados.verduras.metricas.top_performer.nome
            }
        ];

        tbody.innerHTML = categorias.map(cat => `
            <tr>
                <td><strong>${cat.nome}</strong></td>
                <td>R$ ${(cat.faturamento/1000).toFixed(1)}K</td>
                <td>
                    <span class="${cat.variacao >= 0 ? 'positive' : 'negative'}">
                        ${cat.variacao >= 0 ? '+' : ''}${cat.variacao.toFixed(1)}%
                    </span>
                </td>
                <td>${(cat.volume/1000).toFixed(1)}K t</td>
                <td>${cat.topProduto}</td>
                <td>
                    <span class="status-badge ${cat.variacao >= 5 ? 'positive' : cat.variacao <= -5 ? 'negative' : 'neutral'}">
                        ${cat.variacao >= 5 ? 'Alta' : cat.variacao <= -5 ? 'Baixa' : 'Estável'}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    configurarEventos() {
        // Botão de exportar
        document.getElementById('exportReport').addEventListener('click', () => {
            this.exportarRelatorio();
        });

        // Botão de refresh
        document.getElementById('btnRefresh').addEventListener('click', () => {
            this.recarregarDados();
        });

        // Cards KPI clicáveis
        document.querySelectorAll('.kpi-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const kpiType = e.currentTarget.dataset.kpi;
                this.mostrarDetalhesKPI(kpiType);
            });
        });
    }

    exportarRelatorio() {
    try {
        console.log('📊 Iniciando exportação do relatório consolidado...');
        
        // Criar dados estruturados para o relatório
        const relatorio = {
            titulo: "Relatório Consolidado - Dados Gerais",
            dataGeracao: new Date().toLocaleString('pt-BR'),
            periodoSobre: "2024 vs 2025",
            metricasConsolidadas: {
                faturamentoTotal: this.totais.faturamento_2025,
                variacaoFaturamento: this.totais.variacao_faturamento,
                volumeTotal: this.totais.volume_2025,
                variacaoVolume: this.totais.variacao_volume,
                topPerformer: this.topPerformerGlobal.nome,
                performanceTopPerformer: this.topPerformerGlobal.variacao
            },
            categorias: [],
            top5Global: []
        };

        // Adicionar dados por categoria
        ['frutas', 'legumes', 'verduras'].forEach(categoria => {
            const dados = this.dadosConsolidados[categoria];
            if (dados && dados.metricas) {
                relatorio.categorias.push({
                    categoria: categoria.charAt(0).toUpperCase() + categoria.slice(1),
                    faturamento: dados.metricas.faturamento_2025,
                    variacao: dados.metricas.variacao_faturamento,
                    volume: dados.metricas.volume_2025,
                    topProduto: dados.metricas.top_performer.nome
                });
            }
        });

        // Adicionar top 5 global
        const todosTop5 = [
            ...this.dadosConsolidados.frutas.dados.top5.map(p => ({...p, categoria: 'Frutas'})),
            ...this.dadosConsolidados.legumes.dados.top5.map(p => ({...p, categoria: 'Legumes'})),
            ...this.dadosConsolidados.verduras.dados.top5.map(p => ({...p, categoria: 'Verduras'}))
        ];

        relatorio.top5Global = todosTop5
            .sort((a, b) => b.total - a.total)
            .slice(0, 5)
            .map(item => ({
                produto: item.nome,
                categoria: item.categoria,
                faturamento: item.total,
                mediaMensal: item.media,
                variacao: item.var
            }));

        // Gerar CSV
        this.gerarCSV(relatorio);
        
        // Feedback visual
        this.mostrarNotificacao('Relatório exportado com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao exportar relatório:', error);
        this.mostrarNotificacao('Erro ao exportar relatório', 'error');
    }
}
gerarCSV(relatorio) {
    let csvContent = [];
    
    // Cabeçalho do relatório
    csvContent.push(`"${relatorio.titulo}"`);
    csvContent.push(`"Data de geração; ${relatorio.dataGeracao}"`);
    csvContent.push(`"Período de análise; ${relatorio.periodoSobre}"`);
    csvContent.push('');
    
    // Métricas Consolidadas
    csvContent.push('"MÉTRICAS CONSOLIDADAS"');
    csvContent.push('"Indicador";"Valor"');
    csvContent.push(`"Faturamento Total 2025";"R$ ${(relatorio.metricasConsolidadas.faturamentoTotal/1000).toFixed(1)}K"`);
    csvContent.push(`"Variação do Faturamento";"${relatorio.metricasConsolidadas.variacaoFaturamento >= 0 ? '+' : ''}${relatorio.metricasConsolidadas.variacaoFaturamento.toFixed(1)}%"`);
    csvContent.push(`"Volume Total";"${(relatorio.metricasConsolidadas.volumeTotal/1000).toFixed(1)}K t"`);
    csvContent.push(`"Variação do Volume";"${relatorio.metricasConsolidadas.variacaoVolume >= 0 ? '+' : ''}${relatorio.metricasConsolidadas.variacaoVolume.toFixed(1)}%"`);
    csvContent.push(`"Top Performer";"${relatorio.metricasConsolidadas.topPerformer} (+${relatorio.metricasConsolidadas.performanceTopPerformer.toFixed(1)}%)"`);
    csvContent.push('');
    
    // Dados por Categoria
    csvContent.push('"DESEMPENHO POR CATEGORIA"');
    csvContent.push('"Categoria";"Faturamento 2025";"Variação";"Volume";"Top Produto"');
    relatorio.categorias.forEach(cat => {
        csvContent.push(`"${cat.categoria}";"R$ ${(cat.faturamento/1000).toFixed(1)}K";"${cat.variacao >= 0 ? '+' : ''}${cat.variacao.toFixed(1)}%";"${(cat.volume/1000).toFixed(1)}K t";"${cat.topProduto}"`);
    });
    csvContent.push('');
    
    // Top 5 Global
    csvContent.push('"TOP 5 PRODUTOS - TODAS AS CATEGORIAS"');
    csvContent.push('"Posição";"Produto";"Categoria";"Faturamento 2025";"Média Mensal";"Variação"');
    relatorio.top5Global.forEach((item, index) => {
        csvContent.push(`"${index + 1}";"${item.produto}";"${item.categoria}";"R$ ${item.faturamento.toFixed(2)}";"R$ ${item.mediaMensal.toFixed(2)}";"${item.variacao >= 0 ? '+' : ''}${item.variacao.toFixed(1)}%"`);
    });
    csvContent.push('');
    
    // Distribuição Percentual
    csvContent.push('"DISTRIBUIÇÃO POR CATEGORIA"');
    csvContent.push('"Categoria";"Participação";"Faturamento"');
    const totalFaturamento = relatorio.categorias.reduce((sum, cat) => sum + cat.faturamento, 0);
    relatorio.categorias.forEach(cat => {
        const participacao = ((cat.faturamento / totalFaturamento) * 100).toFixed(1);
        csvContent.push(`"${cat.categoria}";"${participacao}%";"R$ ${(cat.faturamento/1000).toFixed(1)}K"`);
    });
    
    // Juntar com quebras de linha
    const csvFinal = csvContent.join('\n');
    
    // SOLUÇÃO PARA ACENTOS: Adicionar BOM (Byte Order Mark)
    const BOM = "\uFEFF";
    const csvComEncoding = BOM + csvFinal;
    
    // Criar e baixar arquivo COM encoding correto
    const blob = new Blob([csvComEncoding], { 
        type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_consolidado_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpar URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
}
mostrarNotificacao(mensagem, tipo = 'info') {
    // Remover notificação anterior se existir
    const notificacaoExistente = document.querySelector('.notification-export');
    if (notificacaoExistente) {
        notificacaoExistente.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification-export notification-${tipo}`;
    notification.innerHTML = `
        <i class="fas fa-${this.getNotificationIcon(tipo)}"></i>
        <span>${mensagem}</span>
    `;
    
    // Estilos da notificação
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${this.getNotificationColor(tipo)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        animation: slideIn 0.3s ease-out;
        font-family: inherit;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover após 4 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

getNotificationIcon(tipo) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[tipo] || 'info-circle';
}

getNotificationColor(tipo) {
    const colors = {
        success: '#059669',
        error: '#dc2626',
        warning: '#d97706',
        info: '#1e40af'
    };
    return colors[tipo] || '#1e40af';
}

    recarregarDados() {
        document.getElementById('loadingState').classList.remove('hidden');
        this.init();
    }

    mostrarDetalhesKPI(kpiType) {
        // Implementar modal com detalhes do KPI
        console.log('Detalhes do KPI:', kpiType);
    }

    mostrarErro(mensagem) {
        alert(`Erro: ${mensagem}`);
    }
}

// Inicializar dashboard quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new DadosGeraisDashboard();
});



// function exportarDados() {
//     const conteudoCSV = "Fruta;Total 2025;Média Mensal;Variação(%)\n" +
//         dadosTop5.map(fruta => `"${fruta.nome}";${fruta.total};${fruta.media};${fruta.variacao}`).join("\n");
    
//     const blob = new Blob(["\uFEFF" + conteudoCSV], { 
//     type: 'text/csv; charset=utf-8;' 
// });
//     const url = window.URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.download = 'top5_frutas.csv';
//     link.click();
//     window.URL.revokeObjectURL(url);
    
//     // Feedback visual
//     const botaoExportar = document.getElementById('exportBtn');
//     const textoOriginal = botaoExportar.innerHTML;
//     botaoExportar.innerHTML = '<i class="fas fa-check"></i> Exportado!';
//     botaoExportar.style.background = 'rgba(0, 230, 118, 0.1)';
//     botaoExportar.style.color = '#00e676';
//     botaoExportar.style.borderColor = 'rgba(0, 230, 118, 0.3)';
    
//     setTimeout(() => {
//         botaoExportar.innerHTML = textoOriginal;
//         botaoExportar.style.background = '';
//         botaoExportar.style.color = '';
//         botaoExportar.style.borderColor = '';
//     }, 2000);
// }