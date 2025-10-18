// 🔹 Separa os dados em variáveis diferentes
const dadosLow = [];
const dadosDeepLow = [];

async function carregarDados() {
  try {
    const resposta = await fetch('/api/verduras/dados');  // ← MUDANÇA AQUI
    if (!resposta.ok) throw new Error('Erro ao buscar dados');
    const resultado = await resposta.json();
    
    // 🔹 Carrega dados low
    Object.assign(dadosLow, resultado.dados.low);  
    
    console.log('Dados LOW recebidos:', dadosLow);
    criarGrafico();
  } catch (erro) {
    console.error('Falha ao carregar dados:', erro);
  }
}

function criarGrafico() {
  const ctxAlertas = document.getElementById('chartAlertas');
  
  // 🔹 Verifica se já existe um gráfico e destrói
  if (ctxAlertas.chart) {
    ctxAlertas.chart.destroy();
  }
  
  new Chart(ctxAlertas, {
    type: 'bar',
    data: {
      labels: dadosLow.map(d => d.nome),
      datasets: [{
        label: 'Queda (%) - LOW',
        data: dadosLow.map(d => d.var),
        borderColor: '#ff7474',
        backgroundColor: 'rgba(255, 116, 116, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ff7474',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 2000,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: { display: true }, // 🔹 Mostra legenda para diferenciar
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: { color: '#9fb7c9' },
          grid: { color: 'rgba(255,255,255,0.05)' },
          suggestedMin: -100,
          suggestedMax: 50
        },
        x: {
          ticks: {
            color: '#cfeafc',
            maxRotation: 45,
            minRotation: 45
          },
          grid: { display: false }
        }
      },
      interaction: {
        intersect: false,
        mode: 'nearest'
      }
    }
  });
  
  // 🔹 Guarda referência do gráfico
  ctxAlertas.chart = this;
}

async function carregarDados2() {
  try {
    const resposta = await fetch('/api/verduras/dados');  // ← MUDANÇA AQUI
    if (!resposta.ok) throw new Error('Erro ao buscar dados');
    const resultado = await resposta.json();
    
    // 🔹 Carrega dados deep_low
    Object.assign(dadosDeepLow, resultado.dados.deep_low);  
    
    console.log('Dados DEEP LOW recebidos:', dadosDeepLow);
    criarGrafico2();
  } catch (erro) {
    console.error('Falha ao carregar dados:', erro);
  }
}

function criarGrafico2() {
  const ctxAlertas2 = document.getElementById('chartAlertas2');
  
  // 🔹 Verifica se já existe um gráfico e destrói
  if (ctxAlertas2.chart) {
    ctxAlertas2.chart.destroy();
  }
  
  new Chart(ctxAlertas2, {
    type: 'line',
    data: {
      labels: dadosDeepLow.map(d => d.nome),
      datasets: [{
        label: 'Queda (%) - DEEP LOW',
        data: dadosDeepLow.map(d => d.var),
        borderColor: '#ff0000', // 🔹 Cor diferente para diferenciar
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#ff0000',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 2000,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: { display: true },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: { color: '#9fb7c9' },
          grid: { color: 'rgba(255,255,255,0.05)' },
          suggestedMin: -100,
          suggestedMax: 50
        },
        x: {
          ticks: {
            color: '#cfeafc',
            maxRotation: 45,
            minRotation: 45
          },
          grid: { display: false }
        }
      },
      interaction: {
        intersect: false,
        mode: 'nearest'
      }
    }
  });
  
  // 🔹 Guarda referência do gráfico
  ctxAlertas2.chart = this;
}

// 🔹 Chama as funções
carregarDados();
carregarDados2();