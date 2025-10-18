const dadosOportunidades = [
  {nome:'Alface Crespa', valor:72},
  {nome:'Rúcula', valor:58},
  {nome:'Espinafre', valor:45},
  {nome:'Agrião', valor:38},
  {nome:'Couve', valor:32}
];

const ctxOportunidades = document.getElementById('chartOportunidades');
const gradientOportunidades = ctxOportunidades.getContext('2d').createLinearGradient(0, 0, 0, 150);
gradientOportunidades.addColorStop(0, 'rgba(0,230,118,0.8)');
gradientOportunidades.addColorStop(1, 'rgba(0,176,255,0.8)');

new Chart(ctxOportunidades, {
  type:'bar',
  data:{
    labels:dadosOportunidades.map(d=>d.nome),
    datasets:[{
      label:'Oportunidade (%)',
      data:dadosOportunidades.map(d=>d.valor),
      backgroundColor: gradientOportunidades,
      borderRadius: 6,       // barras arredondadas
      barPercentage: 0.6
    }]
  },
  options:{
    responsive:true,
    animation:{
      duration: 1500,
      easing: 'easeOutBounce' // animação de entrada
    },
    plugins:{
      legend:{display:false},
      tooltip:{mode:'index', intersect:false}
    },
    scales:{
      y:{
        beginAtZero:true,
        ticks:{color:'#9fb7c9'},
        grid:{color:'rgba(255,255,255,0.05)'}
      },
      x:{
        ticks:{color:'#cfeafc'},
        grid:{display:false}
      }
    }
  }
});