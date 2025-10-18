// high_performance_legumes.js - VERSÃO CORRIGIDA PARA LEGUMES
const fmtMoney = v => Number(v || 0).toLocaleString('pt-BR', {style:'currency',currency:'BRL'});
const fmtPct = v => (v>0?'+':'') + Number(v || 0).toFixed(2) + '%';

// Puxa dados do endpoint CORRETO para legumes
fetch('/api/legumes/high')  // ← CORRIGIDO: endpoint específico para legumes
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(dados => {
    console.log('Dados de legumes recebidos:', dados); // Para debug
    
    // Preenche tabela Alta Performance
    const tbody = document.getElementById('tableHigh');
    tbody.innerHTML = ''; // Limpar antes de preencher
    
    dados.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${r.nome}</strong></td>
        <td>${fmtMoney(r.total)}</td>
        <td>${fmtMoney(r.media)}</td>
        <td class="${r.var > 0 ? 'positive' : 'negative'}">${fmtPct(r.var)}</td>
        <td>
          <span class="status-badge ${r.var > 0 ? 'status-positive' : 'status-negative'}">
            ${r.var > 0 ? 'Crescimento' : 'Queda'}
          </span>
        </td>
        <td>
          <button class="action-btn view-btn" data-product="${r.nome}">
            <i class="fas fa-chart-line"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Atualiza KPIs
    atualizarKPIs(dados);

    // Gráfico de Alta Performance
    const ctxHigh = document.getElementById('chartHigh');
    new Chart(ctxHigh, {
      type: 'line',
      data: {
        labels: dados.map(d => d.nome),
        datasets: [{
          label: 'Total 2025 (R$)',
          data: dados.map(d => d.total),
          fill: true,
          tension: 0.35,
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          borderColor: 'rgba(37, 99, 235, 0.9)',
          pointBackgroundColor: 'rgba(5, 150, 105, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { 
            ticks: { color: '#94a3b8' }, 
            grid: { color: 'rgba(255,255,255,0.03)' } 
          },
          x: { 
            ticks: { color: '#cbd5e1' } 
          }
        }
      }
    });

    // Gráfico de Distribuição
    const ctxDistribution = document.getElementById('chartDistribution');
    new Chart(ctxDistribution, {
      type: 'doughnut',
      data: {
        labels: dados.map(d => d.nome),
        datasets: [{
          data: dados.map(d => d.total),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(14, 165, 233, 0.8)',
            'rgba(236, 72, 153, 0.8)'
          ],
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              font: { size: 11 }
            }
          }
        }
      }
    });

    // Configurar eventos
    configurarEventos(dados);
  })
  .catch(err => {
    console.error('Erro ao carregar dados de legumes:', err);
    // Mostrar erro na página
    const erroDiv = document.createElement('div');
    erroDiv.style.cssText = `
      background: #dc2626;
      color: white;
      padding: 1rem;
      border-radius: 0.5rem;
      margin: 1rem 0;
      text-align: center;
    `;
    erroDiv.textContent = `Erro ao carregar dados de legumes: ${err.message}`;
    document.querySelector('.main').prepend(erroDiv);
  });

// Função para atualizar KPIs
function atualizarKPIs(dados) {
  if (!dados.length) return;

  // Total High Performers
  document.getElementById('kpi-total-high').textContent = dados.length;

  // Maior Crescimento
  const maiorCrescimento = dados.reduce((max, item) => 
    item.var > max.var ? item : max, dados[0]);
  document.getElementById('kpi-maior-crescimento').textContent = maiorCrescimento.nome;
  document.getElementById('kpi-maior-crescimento-valor').textContent = fmtPct(maiorCrescimento.var);

  // Faturamento Total
  const faturamentoTotal = dados.reduce((sum, item) => sum + (item.total || 0), 0);
  document.getElementById('kpi-faturamento-total').textContent = fmtMoney(faturamentoTotal);

  // Crescimento Médio
  const crescimentoMedio = dados.reduce((sum, item) => sum + (item.var || 0), 0) / dados.length;
  document.getElementById('kpi-crescimento-medio').textContent = fmtPct(crescimentoMedio);
}

// Função para configurar eventos
function configurarEventos(dados) {
  // Eventos de ordenação
  document.getElementById('sortNameBtn')?.addEventListener('click', () => ordenarTabela('nome', dados));
  document.getElementById('sortGrowthBtn')?.addEventListener('click', () => ordenarTabela('crescimento', dados));
  document.getElementById('sortRevenueBtn')?.addEventListener('click', () => ordenarTabela('faturamento', dados));

  // Eventos de exportação
  document.getElementById('exportBtn')?.addEventListener('click', () => exportarDados(dados));

  // Eventos de botões de ação
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productName = e.target.closest('.view-btn').dataset.product;
      abrirModalDetalhes(productName, dados);
    });
  });
}

// Função para ordenar tabela
function ordenarTabela(campo, dados) {
  const tbody = document.getElementById('tableHigh');
  let dadosOrdenados = [...dados];

  switch(campo) {
    case 'nome':
      dadosOrdenados.sort((a, b) => a.nome.localeCompare(b.nome));
      break;
    case 'crescimento':
      dadosOrdenados.sort((a, b) => b.var - a.var);
      break;
    case 'faturamento':
      dadosOrdenados.sort((a, b) => b.total - a.total);
      break;
  }

  tbody.innerHTML = '';
  dadosOrdenados.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${r.nome}</strong></td>
      <td>${fmtMoney(r.total)}</td>
      <td>${fmtMoney(r.media)}</td>
      <td class="${r.var > 0 ? 'positive' : 'negative'}">${fmtPct(r.var)}</td>
      <td>
        <span class="status-badge ${r.var > 0 ? 'status-positive' : 'status-negative'}">
          ${r.var > 0 ? 'Crescimento' : 'Queda'}
        </span>
      </td>
      <td>
        <button class="action-btn view-btn" data-product="${r.nome}">
          <i class="fas fa-chart-line"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Reconfigurar eventos dos botões
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productName = e.target.closest('.view-btn').dataset.product;
      abrirModalDetalhes(productName, dadosOrdenados);
    });
  });
}

// Função para exportar dados
function exportarDados(dados) {
  const conteudoCSV = "Legume;Total 2025;Média Mensal;Crescimento(%)\n" +
    dados.map(legume => `"${legume.nome}";${legume.total};${legume.media};${legume.var}`).join("\n");
  
  const blob = new Blob(["\uFEFF" + conteudoCSV], { 
    type: 'text/csv; charset=utf-8;' 
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'high_performance_legumes.csv';
  link.click();
  window.URL.revokeObjectURL(url);
}

// Função para abrir modal de detalhes
function abrirModalDetalhes(productName, dados) {
  const produto = dados.find(p => p.nome === productName);
  if (!produto) return;

  const modal = document.getElementById('detailModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('modalContent');

  modalTitle.textContent = `Detalhes - ${produto.nome}`;
  modalContent.innerHTML = `
    <div class="modal-details">
      <div class="detail-item">
        <span class="detail-label">Total 2025:</span>
        <span class="detail-value">${fmtMoney(produto.total)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Média Mensal:</span>
        <span class="detail-value">${fmtMoney(produto.media)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Crescimento:</span>
        <span class="detail-value ${produto.var > 0 ? 'positive' : 'negative'}">${fmtPct(produto.var)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Status:</span>
        <span class="detail-value ${produto.var > 0 ? 'positive' : 'negative'}">
          ${produto.var > 0 ? 'Em Crescimento' : 'Em Queda'}
        </span>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Configurar evento de fechar
  document.getElementById('modalClose').addEventListener('click', fecharModal);
  document.getElementById('modalCloseBtn').addEventListener('click', fecharModal);
  document.querySelector('.modal-overlay').addEventListener('click', fecharModal);

  function fecharModal() {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}



