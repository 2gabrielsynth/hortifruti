// high_performance.js - VERSÃO CORRIGIDA
const fmtMoney = v => Number(v || 0).toLocaleString('pt-BR', {style:'currency',currency:'BRL'});
const fmtPct = v => (v>0?'+':'') + Number(v || 0).toFixed(2) + '%';

// Puxa dados do endpoint CORRETO
fetch('/api/high')  // ← CORRIGIDO: era '/api/dados'
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(dados => {
    console.log('Dados recebidos:', dados); // Para debug
    
    // Preenche tabela Alta Performance
    const tbody = document.getElementById('tableHigh');
    tbody.innerHTML = ''; // Limpar antes de preencher
    
    dados.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${r.nome}</strong></td>
        <td>${fmtMoney(r.total)}</td>
        <td class="${r.var > 0 ? 'positive' : 'negative'}">${fmtPct(r.var)}</td>
      `;
      tbody.appendChild(tr);
    });

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
  })
  .catch(err => {
    console.error('Erro ao carregar dados:', err);
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
    erroDiv.textContent = `Erro ao carregar dados: ${err.message}`;
    document.querySelector('.main').prepend(erroDiv);
  });