// =============================================
// DADOS E CONFIGURAÇÕES
// =============================================

// Variáveis globais
let dadosTop5 = []; 
let dadosComparativos = null;
let graficoTop5;
let tipoGraficoAtual = 'barra';
let ordenacaoAtual = 'original';
let emTelaCheia = false;

// =============================================
// FUNÇÕES DE FORMATAÇÃO
// =============================================

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
    });
}

function formatarPorcentagem(valor) {
    const numero = Number(valor || 0);
    return (numero > 0 ? '+' : '') + numero.toFixed(2) + '%';
}

// =============================================
// FUNÇÕES DE INICIALIZAÇÃO
// =============================================

async function buscarDadosTop5() {
    try {
        const resposta = await fetch('/api/top5');

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const dadosRecebidos = await resposta.json();

        // Processar os dados para garantir tipos numéricos
        const top5Processado = dadosRecebidos.map((item, indice) => {
            const itemProcessado = {
                ...item,
                total: Number(item.total) || 0,
                media: Number(item.media) || 0,
                variacao: Number(item.var) || 0
            };

            return itemProcessado;
        });

        return top5Processado;

    } catch (erro) {
        console.error('Erro ao buscar dados:', erro);
        mostrarErro('Não foi possível carregar os dados. Tente recarregar a página.');
        return [];
    }
}

async function buscarDadosComparativos() {
    try {
        const resposta = await fetch('/api/chart-data?chart_type=top5_comparison');
        
        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const dadosRecebidos = await resposta.json();
        return dadosRecebidos;

    } catch (erro) {
        console.error('Erro ao buscar dados comparativos:', erro);
        return null;
    }
}

function mostrarErro(mensagem) {
    const elementoErro = document.createElement('div');
    elementoErro.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4757;
        color: white;
        padding: 16px;
        border-radius: 8px;
        z-index: 10000;
        max-width: 300px;
    `;
    elementoErro.textContent = mensagem;
    document.body.appendChild(elementoErro);
    
    setTimeout(() => {
        elementoErro.remove();
    }, 5000);
}

document.addEventListener('DOMContentLoaded', async function() {
    mostrarCarregamento();
    
    // Buscar dados de 2025 e dados comparativos simultaneamente
    const [dados2025, dadosComp] = await Promise.all([
        buscarDadosTop5(),
        buscarDadosComparativos()
    ]);
    
    dadosTop5 = dados2025;
    dadosComparativos = dadosComp;
    
    if (dadosTop5.length > 0) {
        popularIndicadoresChave();
        popularTabela();
        criarGrafico();
        configurarEventos();
        inicializarModalKPI();
        esconderCarregamento();
    } else {
        mostrarErro('Nenhum dado disponível');
        esconderCarregamento();
    }
});

function mostrarCarregamento() {
    const carregamento = document.createElement('div');
    carregamento.id = 'indicador-carregamento';
    carregamento.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        padding: 20px;
        border-radius: 12px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 12px;
        color: white;
    `;
    carregamento.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        <span>Carregando dados...</span>
    `;
    document.body.appendChild(carregamento);
}

function esconderCarregamento() {
    const carregamento = document.getElementById('indicador-carregamento');
    if (carregamento) {
        carregamento.remove();
    }
}

function configurarEventos() {
    document.getElementById('exportBtn').addEventListener('click', exportarDados);
    document.getElementById('toggleChartBtn').addEventListener('click', alternarTipoGrafico);
    document.getElementById('fullscreenBtn').addEventListener('click', alternarTelaCheia);
    document.getElementById('downloadChartBtn').addEventListener('click', baixarGrafico);
    document.getElementById('sortNameBtn').addEventListener('click', () => ordenarTabela('nome'));
    document.getElementById('sortTotalBtn').addEventListener('click', () => ordenarTabela('total'));
    
    // Eventos de tela cheia
    document.addEventListener('fullscreenchange', gerenciarMudancaTelaCheia);
    document.addEventListener('webkitfullscreenchange', gerenciarMudancaTelaCheia);
    document.addEventListener('msfullscreenchange', gerenciarMudancaTelaCheia);
    
    // Evento de redimensionamento da janela
    window.addEventListener('resize', gerenciarRedimensionamentoJanela);
}

// =============================================
// FUNÇÕES DOS INDICADORES CHAVE (KPI)
// =============================================

function popularIndicadoresChave() {
    const lider = dadosTop5[0];
    const maiorCrescimento = [...dadosTop5].sort((a, b) => b.variacao - a.variacao)[0];
    const faturamentoTotal = dadosTop5.reduce((soma, item) => soma + item.total, 0);
    const mediaGeral = dadosTop5.reduce((soma, item) => soma + item.media, 0) / dadosTop5.length;

    // Líder do Ranking
    document.getElementById('kpi-lider').textContent = lider.nome;
    document.getElementById('kpi-lider-trend').innerHTML = 
        lider.variacao > 0 ? 
        `<i class="fas fa-arrow-up"></i> ${formatarPorcentagem(lider.variacao)}` :
        `<i class="fas fa-arrow-down"></i> ${formatarPorcentagem(lider.variacao)}`;
    
    document.getElementById('kpi-lider-trend').className = 
        `kpi-trend ${lider.variacao > 0 ? 'positive' : 'negative'}`;

    // Faturamento Total
    document.getElementById('kpi-total').textContent = formatarMoeda(faturamentoTotal);

    // Maior Crescimento
    document.getElementById('kpi-maior-crescimento').textContent = maiorCrescimento.nome;
    document.getElementById('kpi-maior-crescimento-valor').textContent = formatarPorcentagem(maiorCrescimento.variacao);

    // Média Geral
    document.getElementById('kpi-media-geral').textContent = formatarMoeda(mediaGeral);
}

// =============================================
// FUNÇÕES DA TABELA
// =============================================

function popularTabela() {
    const corpoTabelaTop5 = document.getElementById('tableTop5');
    corpoTabelaTop5.innerHTML = '';

    dadosTop5.forEach((fruta, indice) => {
        const linha = document.createElement('tr');
        
        const variacao = Number(fruta.variacao);
        
        const classePosicao = indice === 0 ? 'position-1' : 
                            indice === 1 ? 'position-2' : 
                            indice === 2 ? 'position-3' : '';
        
        const classeStatus = !isNaN(variacao) && variacao > 0 ? 'status-positive' : 
                           !isNaN(variacao) && variacao < 0 ? 'status-negative' : 'status-neutral';
        
        const textoStatus = !isNaN(variacao) && variacao > 0 ? 'Crescimento' : 
                          !isNaN(variacao) && variacao < 0 ? 'Queda' : 'Estável';

        const textoVariacao = !isNaN(variacao) ? formatarPorcentagem(variacao) : 'N/A';
        const classeVariacao = !isNaN(variacao) && variacao > 0 ? 'positive' : 'negative';

        linha.innerHTML = `
            <td class="${classePosicao}">${indice + 1}º</td>
            <td><strong>${fruta.nome}</strong></td>
            <td>${formatarMoeda(fruta.total)}</td>
            <td>${formatarMoeda(fruta.media)}</td>
            <td class="${classeVariacao}">${textoVariacao}</td>
            <td><span class="status-badge ${classeStatus}">${textoStatus}</span></td>
        `;
        corpoTabelaTop5.appendChild(linha);
    });
}

function ordenarTabela(campo) {
    if (ordenacaoAtual === campo) {
        dadosTop5.reverse();
    } else {
        dadosTop5.sort((a, b) => {
            if (campo === 'nome') return a.nome.localeCompare(b.nome);
            if (campo === 'total') return b.total - a.total;
            return 0;
        });
        ordenacaoAtual = campo;
    }
    popularTabela();
}

// =============================================
// FUNÇÕES DO GRÁFICO
// =============================================

function criarGrafico() {
    const contextoTop5 = document.getElementById('chartTop5');
    
    if (graficoTop5) {
        graficoTop5.destroy();
    }

    const tipoGrafico = tipoGraficoAtual === 'barra' ? 'bar' : 'line';

    graficoTop5 = new Chart(contextoTop5, {
        type: tipoGrafico,
        data: {
            labels: dadosTop5.map(dado => dado.nome),
            datasets: [{
                label: 'Média Mensal (R$)',
                data: dadosTop5.map(dado => dado.media),
                backgroundColor: (contexto) => {
                    const canvas = contexto.chart.ctx;
                    const gradiente = canvas.createLinearGradient(0, 0, 0, 200);
                    gradiente.addColorStop(0, 'rgba(0, 176, 255, 0.85)');
                    gradiente.addColorStop(1, 'rgba(0, 230, 118, 0.85)');
                    return gradiente;
                },
                borderColor: 'rgba(0, 230, 118, 0.9)',
                borderWidth: 2,
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
                        label: function(contexto) {
                            return `Média: ${formatarMoeda(contexto.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: { 
                        color: '#9fb7c9' 
                    },
                    grid: { 
                        color: 'rgba(255,255,255,0.03)' 
                    }
                },
                x: {
                    ticks: { 
                        color: '#cfeafc',
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

function alternarTipoGrafico() {
    tipoGraficoAtual = tipoGraficoAtual === 'barra' ? 'linha' : 'barra';
    criarGrafico();
}

// =============================================
// FUNÇÕES DE TELA CHEIA
// =============================================

function alternarTelaCheia() {
    const cardGrafico = document.querySelector('.chart-card');
    const botaoTelaCheia = document.getElementById('fullscreenBtn');
    const icone = botaoTelaCheia.querySelector('i');
    
    if (!emTelaCheia) {
        // Entrar em tela cheia
        if (cardGrafico.requestFullscreen) {
            cardGrafico.requestFullscreen();
        } else if (cardGrafico.webkitRequestFullscreen) {
            cardGrafico.webkitRequestFullscreen();
        } else if (cardGrafico.msRequestFullscreen) {
            cardGrafico.msRequestFullscreen();
        }
        
        icone.className = 'fas fa-compress';
        cardGrafico.classList.add('fullscreen-mode');
        emTelaCheia = true;
        
    } else {
        // Sair da tela cheia
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        
        icone.className = 'fas fa-expand';
        cardGrafico.classList.remove('fullscreen-mode');
        emTelaCheia = false;
    }
}

function gerenciarMudancaTelaCheia() {
    const cardGrafico = document.querySelector('.chart-card');
    const botaoTelaCheia = document.getElementById('fullscreenBtn');
    const icone = botaoTelaCheia.querySelector('i');
    
    const estaEmTelaCheia = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    
    if (!estaEmTelaCheia && emTelaCheia) {
        // Saiu do modo tela cheia
        icone.className = 'fas fa-expand';
        cardGrafico.classList.remove('fullscreen-mode');
        emTelaCheia = false;
        
        // Recriar o gráfico
        setTimeout(() => {
            if (graficoTop5) {
                graficoTop5.destroy();
                setTimeout(() => {
                    criarGrafico();
                }, 50);
            }
        }, 100);
        
    } else if (estaEmTelaCheia && !emTelaCheia) {
        // Entrou no modo tela cheia
        emTelaCheia = true;
        setTimeout(() => {
            if (graficoTop5) {
                graficoTop5.resize();
            }
        }, 100);
    }
}

function gerenciarRedimensionamentoJanela() {
    if (graficoTop5 && !emTelaCheia) {
        clearTimeout(window.tempoRedimensionamento);
        window.tempoRedimensionamento = setTimeout(() => {
            graficoTop5.resize();
        }, 250);
    }
}

// =============================================
// FUNÇÕES DE EXPORTAÇÃO
// =============================================

function exportarDados() {
    const conteudoCSV = "Fruta;Total 2025;Média Mensal;Variação(%)\n" +
        dadosTop5.map(fruta => `"${fruta.nome}";${fruta.total};${fruta.media};${fruta.variacao}`).join("\n");
    
    const blob = new Blob(["\uFEFF" + conteudoCSV], { 
    type: 'text/csv; charset=utf-8;' 
});
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'top5_frutas.csv';
    link.click();
    window.URL.revokeObjectURL(url);
    
    // Feedback visual
    const botaoExportar = document.getElementById('exportBtn');
    const textoOriginal = botaoExportar.innerHTML;
    botaoExportar.innerHTML = '<i class="fas fa-check"></i> Exportado!';
    botaoExportar.style.background = 'rgba(0, 230, 118, 0.1)';
    botaoExportar.style.color = '#00e676';
    botaoExportar.style.borderColor = 'rgba(0, 230, 118, 0.3)';
    
    setTimeout(() => {
        botaoExportar.innerHTML = textoOriginal;
        botaoExportar.style.background = '';
        botaoExportar.style.color = '';
        botaoExportar.style.borderColor = '';
    }, 2000);
}

function baixarGrafico() {
    const link = document.createElement('a');
    link.download = 'grafico_top5.png';
    link.href = document.getElementById('chartTop5').toDataURL();
    link.click();
    
    // Feedback visual
    const botaoDownload = document.getElementById('downloadChartBtn');
    const textoOriginal = botaoDownload.innerHTML;
    botaoDownload.innerHTML = '<i class="fas fa-check"></i>';
    botaoDownload.style.background = 'rgba(0, 230, 118, 0.1)';
    botaoDownload.style.color = '#00e676';
    botaoDownload.style.borderColor = 'rgba(0, 230, 118, 0.3)';
    
    setTimeout(() => {
        botaoDownload.innerHTML = textoOriginal;
        botaoDownload.style.background = '';
        botaoDownload.style.color = '';
        botaoDownload.style.borderColor = '';
    }, 1500);
}

// =============================================
// MODAL KPI COM GRÁFICOS - VERSÃO CORRIGIDA
// =============================================

// Variáveis globais do modal
let graficoModal = null;
let modalInicializado = false;

// Função para inicializar o modal - CHAMAR DEPOIS DOS DADOS
function inicializarModalKPI() {
    if (modalInicializado) return;
    
    const modal = document.getElementById('kpiModal');
    const modalOverlay = document.querySelector('.modal-overlay');
    const modalContainer = document.querySelector('.modal-container');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const modalChartContainer = document.getElementById('modalChartContainer');
    const modalChartCanvas = document.getElementById('modalChartCanvas');
    const modalChartTitle = document.getElementById('modalChartTitle');
    const modalClose = document.getElementById('modalClose');
    const modalBack = document.getElementById('modalBack');
    const modalChartBtn = document.getElementById('modalChartBtn');
    const modalBackText = document.getElementById('modalBackText');
    const modalChartText = document.getElementById('modalChartText');
    const kpiCards = document.querySelectorAll('.kpi-card');
    
    let tipoKpiAtual = '';
    let dadosGraficoAtual = null;
    let modoGraficoAtivo = false;

    // Configurações dos modais - APENAS DADOS REAIS
    const conteudoModal = {
        lider: {
            titulo: 'Líder do Ranking - Detalhes',
            tituloGrafico: 'Comparativo Anual - 2024 vs 2025',
            conteudo: function() {
                const lider = dadosTop5[0];
                return `
                    <div class="modal-kpi-content">
                        <h4>${lider.nome} - Líder Absoluta</h4>
                        <p>A ${lider.nome} mantém a primeira posição no ranking com faturamento médio mensal de <strong>${formatarMoeda(lider.media)}</strong>.</p>
                        <div class="modal-stats">
                            <div class="stat-item">
                                <span class="stat-label">Total 2025:</span>
                                <span class="stat-value">${formatarMoeda(lider.total)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Variação vs 2024:</span>
                                <span class="stat-value ${lider.variacao > 0 ? 'positive' : 'negative'}">${formatarPorcentagem(lider.variacao)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Participação no Top 5:</span>
                                <span class="stat-value">${calcularParticipacao(lider.total)}%</span>
                            </div>
                        </div>
                    </div>
                `;
            },
            dadosGrafico: function() {
                // ✅ USAR APENAS DADOS ANUAIS REAIS
                const lider = dadosTop5[0];
                const total2024 = lider.total / (1 + lider.variacao/100);
                
                return {
                    type: 'annual_comparison',
                    products: [lider.nome],
                    data_2024: [total2024],
                    data_2025: [lider.total]
                };
            }
        },
        faturamento: {
            titulo: 'Faturamento Total - Detalhes',
            tituloGrafico: 'Comparativo do Top 5 - 2024 vs 2025',
            conteudo: function() {
                const faturamentoTotal = dadosTop5.reduce((soma, item) => soma + item.total, 0);
                let faturamentoTotal2024 = 0;
                let crescimentoTotal = 0;
                
                if (dadosComparativos && dadosComparativos.data_2024) {
                    faturamentoTotal2024 = dadosComparativos.data_2024.reduce((soma, valor) => soma + valor, 0);
                    crescimentoTotal = faturamentoTotal2024 ? 
                        ((faturamentoTotal - faturamentoTotal2024) / faturamentoTotal2024 * 100) : 0;
                }
                    
                return `
                    <div class="modal-kpi-content">
                        <h4>Faturamento Consolidado do Top 5</h4>
                        <p>O faturamento total das 5 frutas líderes soma <strong>${formatarMoeda(faturamentoTotal)}</strong> em 2025.</p>
                        <div class="modal-stats">
                            <div class="stat-item">
                                <span class="stat-label">Faturamento 2024:</span>
                                <span class="stat-value">${formatarMoeda(faturamentoTotal2024)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Faturamento 2025:</span>
                                <span class="stat-value">${formatarMoeda(faturamentoTotal)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Crescimento vs 2024:</span>
                                <span class="stat-value ${crescimentoTotal > 0 ? 'positive' : 'negative'}">
                                    ${formatarPorcentagem(crescimentoTotal)}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            },
            dadosGrafico: function() {
                // ✅ USAR DADOS COMPARATIVOS REAIS
                if (dadosComparativos && dadosComparativos.type === 'top5_comparison') {
                    return dadosComparativos;
                } else {
                    // ❌ NÃO USAR DADOS MOCK - retornar vazio
                    return {
                        type: 'no_data',
                        message: 'Dados comparativos não disponíveis'
                    };
                }
            }
        },
        crescimento: {
            titulo: 'Maior Crescimento - Detalhes',
            tituloGrafico: 'Comparativo Anual - 2024 vs 2025',
            conteudo: function() {
                const maiorCrescimento = [...dadosTop5].sort((a, b) => b.variacao - a.variacao)[0];
                return `
                    <div class="modal-kpi-content">
                        <h4>${maiorCrescimento.nome} - Destaque em Crescimento</h4>
                        <p>A ${maiorCrescimento.nome} registrou o maior crescimento entre as top performers, com <strong>${formatarPorcentagem(maiorCrescimento.variacao)}</strong> em 2025.</p>
                        <div class="modal-stats">
                            <div class="stat-item">
                                <span class="stat-label">Faturamento 2025:</span>
                                <span class="stat-value">${formatarMoeda(maiorCrescimento.total)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Faturamento 2024:</span>
                                <span class="stat-value">${formatarMoeda(maiorCrescimento.total / (1 + maiorCrescimento.variacao/100))}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Incremento absoluto:</span>
                                <span class="stat-value positive">${formatarMoeda(maiorCrescimento.total - (maiorCrescimento.total / (1 + maiorCrescimento.variacao/100)))}</span>
                            </div>
                        </div>
                    </div>
                `;
            },
            dadosGrafico: function() {
                // ✅ USAR APENAS DADOS ANUAIS REAIS
                const maiorCrescimento = [...dadosTop5].sort((a, b) => b.variacao - a.variacao)[0];
                const total2024 = maiorCrescimento.total / (1 + maiorCrescimento.variacao/100);
                
                return {
                    type: 'annual_comparison',
                    products: [maiorCrescimento.nome],
                    data_2024: [total2024],
                    data_2025: [maiorCrescimento.total]
                };
            }
        },
        media: {
            titulo: 'Média Geral - Detalhes',
            tituloGrafico: 'Distribuição das Médias Mensais - Top 5',
            conteudo: function() {
                const mediaGeral = dadosTop5.reduce((soma, item) => soma + item.media, 0) / dadosTop5.length;
                return `
                    <div class="modal-kpi-content">
                        <h4>Média de Performance do Top 5</h4>
                        <p>A média geral de faturamento mensal entre as 5 líderes é de <strong>${formatarMoeda(mediaGeral)}</strong> por fruta.</p>
                        <div class="modal-stats">
                            <div class="stat-item">
                                <span class="stat-label">Maior média:</span>
                                <span class="stat-value">${formatarMoeda(dadosTop5[0].media)} (${dadosTop5[0].nome})</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Menor média:</span>
                                <span class="stat-value">${formatarMoeda(dadosTop5[dadosTop5.length-1].media)} (${dadosTop5[dadosTop5.length-1].nome})</span>
                            </div>
                        </div>
                    </div>
                `;
            },
            dadosGrafico: function() {
                // ✅ USAR APENAS DADOS REAIS
                return {
                    type: 'top5_averages',
                    products: dadosTop5.map(item => item.nome),
                    data_2025: dadosTop5.map(item => item.media)
                };
            }
        }
    };

    function calcularParticipacao(totalFruta) {
        const totalGeral = dadosTop5.reduce((soma, item) => soma + item.total, 0);
        return ((totalFruta / totalGeral) * 100).toFixed(1);
    }

    // Função para renderizar gráfico - CORRIGIDA (AGORA É ASYNC)
    async function renderizarGrafico(dados, tituloGrafico) {
        // Destruir gráfico anterior se existir
        if (graficoModal) {
            graficoModal.destroy();
            graficoModal = null;
        }
        
        // Garantir que o canvas está visível e com dimensões
        modalChartContainer.style.display = 'block';
        const container = modalChartCanvas.parentElement;
        
        // Resetar dimensões do canvas
        modalChartCanvas.width = container.offsetWidth;
        modalChartCanvas.height = 300;
        
        try {
            // SE dados é uma função assíncrona, AGUARDAR o resultado
            let dadosParaGrafico = dados;
            if (typeof dados === 'function') {
                dadosParaGrafico = await dados();
            }

            // Verificar se não há dados
            if (dadosParaGrafico.type === 'no_data') {
                modalChartContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-info-circle"></i>
                        <p>${dadosParaGrafico.message || 'Dados não disponíveis'}</p>
                    </div>
                `;
                return;
            }
            
            // Configuração do gráfico baseada no tipo
            let configuracao = {};
            
            if (dadosParaGrafico.type === 'annual_comparison') {
                configuracao = {
                    type: 'bar',
                    data: {
                        labels: dadosParaGrafico.products,
                        datasets: [
                            {
                                label: '2024',
                                data: dadosParaGrafico.data_2024,
                                backgroundColor: 'rgba(100, 116, 139, 0.7)',
                                borderColor: 'rgba(100, 116, 139, 1)',
                                borderWidth: 1
                            },
                            {
                                label: '2025',
                                data: dadosParaGrafico.data_2025,
                                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                                borderColor: 'rgba(59, 130, 246, 1)',
                                borderWidth: 1
                            }
                        ]
                    },
                    options: obterOpcoesGrafico(tituloGrafico)
                };
            }
            else if (dadosParaGrafico.type === 'top5_comparison') {
                configuracao = {
                    type: 'bar',
                    data: {
                        labels: dadosParaGrafico.products,
                        datasets: [
                            {
                                label: '2024',
                                data: dadosParaGrafico.data_2024,
                                backgroundColor: 'rgba(100, 116, 139, 0.7)',
                                borderColor: 'rgba(100, 116, 139, 1)',
                                borderWidth: 1
                            },
                            {
                                label: '2025',
                                data: dadosParaGrafico.data_2025,
                                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                                borderColor: 'rgba(59, 130, 246, 1)',
                                borderWidth: 1
                            }
                        ]
                    },
                    options: obterOpcoesGrafico(tituloGrafico)
                };
            }
            else if (dadosParaGrafico.type === 'top5_averages') {
                configuracao = {
                    type: 'bar',
                    data: {
                        labels: dadosParaGrafico.products,
                        datasets: [{
                            label: 'Média Mensal 2025',
                            data: dadosParaGrafico.data_2025,
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.7)',
                                'rgba(54, 162, 235, 0.7)',
                                'rgba(255, 206, 86, 0.7)',
                                'rgba(75, 192, 192, 0.7)',
                                'rgba(153, 102, 255, 0.7)'
                            ],
                            borderColor: [
                                'rgba(255, 99, 132, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 206, 86, 1)',
                                'rgba(75, 192, 192, 1)',
                                'rgba(153, 102, 255, 1)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: obterOpcoesGrafico(tituloGrafico)
                };
            }
            
            // Criar o gráfico
            graficoModal = new Chart(modalChartCanvas, configuracao);
            
            // Forçar redimensionamento e atualização
            setTimeout(() => {
                if (graficoModal) {
                    graficoModal.resize();
                    graficoModal.update();
                }
            }, 100);
            
        } catch (erro) {
            console.error('Erro ao criar gráfico:', erro);
            modalChartContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao carregar gráfico: ${erro.message}</p>
                </div>
            `;
        }
    }

    function obterOpcoesGrafico(titulo) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'top',
                    labels: {
                        color: '#e2e8f0',
                        font: { size: 12 }
                    }
                },
                title: { 
                    display: true, 
                    text: titulo,
                    color: '#f1f5f9',
                    font: { size: 16, weight: 'bold' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatarMoeda(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#94a3b8',
                        callback: function(valor) {
                            return formatarMoeda(valor);
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#cbd5e1'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                }
            }
        };
    }

    // Função para mostrar/ocultar gráfico
    function alternarVisualizacaoGrafico(mostrarGrafico) {
        if (mostrarGrafico) {
            modalContent.style.display = 'none';
            modalChartContainer.style.display = 'block';
            modalBackText.textContent = 'Voltar aos Detalhes';
            modalChartText.textContent = 'Ocultar Gráfico';
            modoGraficoAtivo = true;
            
            // Forçar redimensionamento do gráfico quando visível
            setTimeout(() => {
                if (graficoModal) {
                    graficoModal.resize();
                }
            }, 50);
            
        } else {
            modalContent.style.display = 'block';
            modalChartContainer.style.display = 'none';
            modalBackText.textContent = 'Voltar';
            modalChartText.textContent = 'Ver Gráfico Detalhado';
            modoGraficoAtivo = false;
        }
    }

    // Abrir modal - CORRIGIDA (AGORA É ASYNC)
    async function abrirModal(tipoKpi) {
        const conteudo = conteudoModal[tipoKpi];
        tipoKpiAtual = tipoKpi;
        
        if (!conteudo) {
            console.error('Conteúdo não encontrado para:', tipoKpi);
            return;
        }

        try {
            // Configurar conteúdo básico
            modalTitle.textContent = conteudo.titulo;
            modalContent.innerHTML = conteudo.conteudo();
            modalChartTitle.textContent = conteudo.tituloGrafico;
            
            // Resetar visualização para conteúdo
            alternarVisualizacaoGrafico(false);
            
            // Mostrar modal
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Animação de entrada
            setTimeout(() => {
                modalContainer.style.transform = 'translateY(0)';
                modalContainer.style.opacity = '1';
            }, 50);
            
            // Carregar e renderizar gráfico IMEDIATAMENTE
            const dadosGrafico = conteudo.dadosGrafico;
            dadosGraficoAtual = dadosGrafico;
            
            // Pequeno delay para garantir que o modal está renderizado
            setTimeout(async () => {
                await renderizarGrafico(dadosGrafico, conteudo.tituloGrafico);
            }, 100);
            
        } catch (erro) {
            console.error('Erro ao abrir modal:', erro);
            modalContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao carregar: ${erro.message}</p>
                </div>
            `;
        }
    }

    // Fechar modal
    function fecharModal() {
        modalContainer.style.transform = 'translateY(-20px)';
        modalContainer.style.opacity = '0';
        
        setTimeout(() => {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
            modoGraficoAtivo = false;
            
            // Limpar gráfico
            if (graficoModal) {
                graficoModal.destroy();
                graficoModal = null;
            }
        }, 300);
    }

    // Event Listeners
    kpiCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function() {
            const tipoKpi = this.getAttribute('data-kpi');
            abrirModal(tipoKpi);
        });
    });

    modalClose.addEventListener('click', fecharModal);
    
    modalBack.addEventListener('click', function() {
        alternarVisualizacaoGrafico(false);
    });

    modalChartBtn.addEventListener('click', function() {
        const graficoVisivel = modoGraficoAtivo;
        alternarVisualizacaoGrafico(!graficoVisivel);
    });

    modalOverlay.addEventListener('click', fecharModal);

    document.addEventListener('keydown', function(evento) {
        if (evento.key === 'Escape' && modal.classList.contains('active')) {
            fecharModal();
        }
    });

    // Adicionar CSS para estilização
    adicionarCSSModal();
    
    modalInicializado = true;
}

function adicionarCSSModal() {
    const estilo = document.createElement('style');
    estilo.textContent = `
        .modal-kpi-content {
            padding: 1rem 0;
        }
        
        .modal-kpi-content h4 {
            color: var(--primary);
            margin-bottom: 1rem;
            font-size: 1.25rem;
        }
        
        .modal-stats {
            background: rgba(255, 255, 255, 0.05);
            border-radius: var(--radius-md);
            padding: 1.5rem;
            margin: 1.5rem 0;
        }
        
        .stat-item {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 0.75rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .stat-item:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        
        .stat-label {
            flex: 1;
            color: var(--text-secondary);
            font-weight: 500;
        }
        
        .stat-value {
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .stat-value.positive {
            color: var(--success);
        }
        
        .stat-value.negative {
            color: var(--danger);
        }
        
        .loading-chart {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem;
            color: var(--text-tertiary);
            height: 300px;
        }
        
        .error-message {
            text-align: center;
            padding: 2rem;
            color: var(--danger);
            height: 300px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        
        .modal-chart-container .chart-container {
            height: 300px !important;
            position: relative;
        }
    `;
    document.head.appendChild(estilo);
}