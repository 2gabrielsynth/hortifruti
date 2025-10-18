from flask import Flask, jsonify, request, send_from_directory, render_template, flash, redirect, url_for, session, send_file
import requests


app = Flask(__name__)


import json
file_path = 'dados.json'

with open(file_path,'r',encoding='utf-8') as arquivo:
    
    dados = json.load(arquivo)

    





total_faturamento = sum(item['total'] for item in dados['top5'])
total_media = sum(item['media'] for item in dados['geral']) / len(dados['geral'])
total_var = sum(item['var'] for item in dados['geral']) / len(dados['geral'])

# Inserir manualmente no dicionário
dados['geral'].append({
    "nome": "TOTAL GERAL",
    "total": total_faturamento,
    "media": total_media,
    "var": total_var
})

@app.route('/api/chart-data')
def get_chart_data():
    product_name = request.args.get('product_name')
    chart_type = request.args.get('chart_type')
    
    try:
        # print(f"Debug: product_name={product_name}, chart_type={chart_type}")
        
        if product_name:
            # Buscar produto específico
            product = next((item for item in dados['top5'] if item['nome'] == product_name), None)
            
            if not product:
                return jsonify({'error': 'Produto não encontrado'}), 404
            
            # ❌ REMOVER COMPLETAMENTE OS DADOS MENSAS FICTÍCIOS
            # ❌ NÃO TEMOS DADOS MENSAS REAIS!
            
            return jsonify({
                'error': 'Dados mensais não disponíveis',
                'message': 'Apenas dados anuais disponíveis',
                'available_data': {
                    'total_2025': product['total'],
                    'media_mensal_2025': product['media'],
                    'variacao_percentual': product['var']
                }
            }), 404
        
        elif chart_type == 'top5_comparison':
            # ✅ ISSO FUNCIONA - temos dados anuais reais
            products = [item['nome'] for item in dados['top5']]
            data_2025 = [item['total'] for item in dados['top5']]
            
            # Calcular 2024 baseado na variação (isso é válido)
            data_2024 = []
            for item in dados['top5']:
                var_decimal = item['var'] / 100
                total_2024 = item['total'] / (1 + var_decimal)
                data_2024.append(round(total_2024, 2))
            
            return jsonify({
                'type': 'top5_comparison',
                'products': products,
                'data_2024': data_2024,  # ✅ DADOS REAIS (calculados)
                'data_2025': data_2025   # ✅ DADOS REAIS
            })
        
        elif chart_type == 'top5_averages':
            # ✅ ISSO FUNCIONA - temos médias mensais reais
            return jsonify({
                'type': 'top5_averages',
                'products': [item['nome'] for item in dados['top5']],
                'averages': [item['media'] for item in dados['top5']],
                'variations': [item['var'] for item in dados['top5']]
            })
        
        else:
            return jsonify({'error': 'Parâmetros inválidos. Use product_name ou chart_type'}), 400
            
    except Exception as e:
        # print(f"Erro em /api/chart-data: {str(e)}")
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500























def get_product_monthly_data(product_name):
    """Busca dados mensais específicos de um produto"""
    # Mapeamento de produtos para IDs (baseado no seu JSON original)
    product_mapping = {
        'Banana Prata': '104',
        'Mamão Papaya': '158', 
        'Laranja Pera': '144',
        'Uva Thompson S/ Caroço': '214',
        'Maçã Gala': '154'
    }
    
    product_id = product_mapping.get(product_name)
    
    if not product_id:
        return {'error': 'Produto não encontrado'}
    
    # Dados de exemplo - você precisará adaptar com seus dados reais
    # Estou criando dados simulados baseados nos totais
    monthly_data_2025 = generate_monthly_data_from_total(dados['top5'], product_name, 2025)
    monthly_data_2024 = generate_monthly_data_from_total(dados['top5'], product_name, 2024)
    
    return {
        'type': 'product_comparison',
        'product_name': product_name,
        'months': ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
        'data_2024': monthly_data_2024,
        'data_2025': monthly_data_2025
    }

def get_top5_2024_data():
    """Calcula dados de 2024 baseado na variação"""
    top5_2024 = []
    for item in dados['top5']:
        # Fórmula: total_2024 = total_2025 / (1 + var/100)
        var_decimal = item['var'] / 100
        total_2024 = item['total'] / (1 + var_decimal)
        top5_2024.append(round(total_2024, 2))
    return top5_2024

def generate_monthly_data_from_total(top5_data, product_name, year):
    """Gera dados mensais simulados baseados no total anual"""
    product = next((item for item in top5_data if item['nome'] == product_name), None)
    
    if not product:
        return []
    
    # Padrões de distribuição mensal típicos (ajuste conforme sua realidade)
    monthly_distribution = [0.12, 0.14, 0.16, 0.15, 0.14, 0.13, 0.16]  # Jan-Jul
    
    if year == 2024:
        # Para 2024, usar o total calculado baseado na variação
        var_decimal = product['var'] / 100
        total_year = product['total'] / (1 + var_decimal)
    else:
        total_year = product['total']
    
    monthly_data = [round(total_year * dist, 2) for dist in monthly_distribution]
    return monthly_data


def calcular_metricas():
    # ✅ USANDO VALORES REAIS DO SEU NEGÓCIO
    faturamento_2025 = 324411.03  # Valor que já estava no hardcoded
    faturamento_2024 = 443915.46 # Para dar -27.2%

    variacao_fat = ((faturamento_2025 - faturamento_2024)/faturamento_2024) * 100
    
    volume_2025 = 38245.39  # 45.2K
    volume_2024 = 43933.79  # 45.2K
    
    variacao_total =  ((volume_2025 - volume_2024)/volume_2024)*100
    
    # Top Performer dinâmico
    top_performer = max(
        [item for item in dados['high'] if item['var'] > 0],
        key=lambda x: x['var']
    )
    
    return {
        "faturamento_2025": faturamento_2025,
        "faturamento_2024": faturamento_2024,
        "variacao_faturamento": variacao_fat,  # Já conhecido
        "volume_2025": volume_2025,
        "volume_2024": volume_2024,
        "variacao_volume": variacao_total,  # Já conhecido
        "top_performer": {
            "nome": top_performer['nome'],
            "variacao": top_performer['var']
        }
    }

@app.route('/')
@app.route('/frutas')
def dashboard():
    return render_template('index_frutas.html')

@app.route('/api/dados')
def api_dados():
    """API que retorna TODOS os dados + métricas calculadas para o dashboard"""
    try:
        metricas = calcular_metricas()
        return jsonify({
            "dados": dados,        # ✅ MANTIDO para as outras páginas
            "metricas": metricas   # ✅ ADICIONADO para o dashboard
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/top5')
def api_top5():
    """API específica para a página Top5 (só os dados top5)"""
    try:
        return jsonify(dados["top5"])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/high')
def api_high():
    """API específica para a página High Performance"""
    try:
        return jsonify(dados["high"])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/top5')
def top5():
    return render_template('top5.html')

@app.route('/high')
def high_performance():
    return render_template('high_performance.html')

@app.route('/oportunidades')
def oportunidades():
    return render_template('oportunidades.html')

@app.route('/alertas')
def alertas():
    return render_template('alertas.html')


@app.route('/dados_gerais')
def dados_gerais():
    # Seus dados aqui
    return render_template('dados_gerais.html', dados=dados)
































# =============================================
# APIs PARA LEGUMES
# =============================================


import json
file_path = 'dados_legumes.json'

with open(file_path,'r',encoding='utf-8') as arquivo:
    
    dados_legumes = json.load(arquivo)

    

def calcular_metricas_legumes():
    """Calcula métricas específicas para legumes"""
    
    # PRIMEIRO: Adicionar TOTAL GERAL aos dados (igual você fez para frutas)
    total_faturamento_legumes = sum(item['total'] for item in dados_legumes['geral'])
    total_media_legumes = sum(item['media'] for item in dados_legumes['geral']) / len(dados_legumes['geral'])
    total_var_legumes = sum(item['var'] for item in dados_legumes['geral']) / len(dados_legumes['geral'])

    # Inserir manualmente no dicionário (IGUAL ÀS FRUTAS)
    dados_legumes['geral'].append({
        "nome": "TOTAL GERAL",
        "total": total_faturamento_legumes,
        "media": total_media_legumes,
        "var": total_var_legumes
    })
    
    # AGORA calcular as métricas (já com TOTAL GERAL incluso)
    faturamento_2025 = sum(item['total'] for item in dados_legumes['geral'] if item['nome'] != 'TOTAL GERAL')
    # print(faturamento_2025)
    faturamento_2024 = 305842.61  # Exemplo: assumindo 10% de crescimento
    
    variacao_fat = ((faturamento_2025 - faturamento_2024) / faturamento_2024) * 100 if faturamento_2024 else 0
    
    volume_2025 = 32326.30
    volume_2024 = 30362.17 # Exemplo: assumindo 8% de crescimento
    
    variacao_total = ((volume_2025 - volume_2024) / volume_2024) * 100 if volume_2024 else 0
    
    # Top Performer dinâmico para legumes
    high_performers = [item for item in dados_legumes.get('high', []) if item.get('var', 0) > 0]
    if high_performers:
        top_performer = max(high_performers, key=lambda x: x['var'])
    else:
        # Fallback para o item com maior variação positiva em geral
        positive_items = [item for item in dados_legumes.get('geral', []) if item.get('var', 0) > 0 and item['nome'] != 'TOTAL GERAL']
        top_performer = max(positive_items, key=lambda x: x['var']) if positive_items else {"nome": "N/A", "var": 0}

    return {
        "faturamento_2025": faturamento_2025,
        "faturamento_2024": faturamento_2024,
        "variacao_faturamento": variacao_fat,
        "volume_2025": volume_2025,
        "volume_2024": volume_2024,
        "variacao_volume": variacao_total,
        "top_performer": {
            "nome": top_performer['nome'],
            "variacao": top_performer['var']
        }
    }





@app.route('/api/legumes/dados')
def api_dados_legumes():
    """API que retorna TODOS os dados + métricas calculadas para o dashboard de legumes"""
    try:
        metricas = calcular_metricas_legumes()
        return jsonify({
            "dados": dados_legumes,
            "metricas": metricas
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/legumes/top5')
def api_top5_legumes():
    """API específica para a página Top5 de legumes"""
    try:
        return jsonify(dados_legumes["top5"])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/legumes/high')
def api_high_legumes():
    """API específica para a página High Performance de legumes"""
    try:
        return jsonify(dados_legumes["high"])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/legumes/chart-data')
def get_chart_data_legumes():
    """API para dados de gráficos específicos de legumes"""
    product_name = request.args.get('product_name')
    chart_type = request.args.get('chart_type')
    
    try:
        # print(f"Debug Legumes: product_name={product_name}, chart_type={chart_type}")
        
        if product_name:
            product = next((item for item in dados_legumes['top5'] if item['nome'] == product_name), None)
            
            if not product:
                return jsonify({'error': 'Produto não encontrado'}), 404
            
            return jsonify({
                'error': 'Dados mensais não disponíveis',
                'message': 'Apenas dados anuais disponíveis',
                'available_data': {
                    'total_2025': product['total'],
                    'media_mensal_2025': product['media'],
                    'variacao_percentual': product['var']
                }
            }), 404
        
        elif chart_type == 'top5_comparison':
            products = [item['nome'] for item in dados_legumes['top5']]
            data_2025 = [item['total'] for item in dados_legumes['top5']]
            
            data_2024 = []
            for item in dados_legumes['top5']:
                var_decimal = item['var'] / 100
                total_2024 = item['total'] / (1 + var_decimal)
                data_2024.append(round(total_2024, 2))
            
            return jsonify({
                'type': 'top5_comparison',
                'products': products,
                'data_2024': data_2024,
                'data_2025': data_2025
            })
        
        elif chart_type == 'top5_averages':
            return jsonify({
                'type': 'top5_averages',
                'products': [item['nome'] for item in dados_legumes['top5']],
                'averages': [item['media'] for item in dados_legumes['top5']],
                'variations': [item['var'] for item in dados_legumes['top5']]
            })
        
        else:
            return jsonify({'error': 'Parâmetros inválidos. Use product_name ou chart_type'}), 400
            
    except Exception as e:
        # print(f"Erro em /api/legumes/chart-data: {str(e)}")
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500








@app.route('/legumes')
def dashboard_legumes():
    return render_template('index_legumes.html')

@app.route('/legumes/top5')
def top5_legumes():
    return render_template('top5_legumes.html')

@app.route('/legumes/high')
def high_performance_legumes():
    return render_template('high_performance_legumes.html')

@app.route('/legumes/oportunidades')
def oportunidades_legumes():
    return render_template('oportunidades_legumes.html')

@app.route('/legumes/alertas')
def alertas_legumes():
    return render_template('alertas_legumes.html')

@app.route('/legumes/dados_gerais')
def dados_gerais_legumes():
    return render_template('dados_gerais_legumes.html', dados=dados_legumes)




































# =============================================
# CARREGAR DADOS DAS VERDURAS
# =============================================

file_path_verduras = 'dados_verduras.json'
try:
    with open(file_path_verduras,'r',encoding='utf-8') as arquivo:
        dados_verduras = json.load(arquivo)
    
    # Calcular e adicionar TOTAL GERAL para verduras
    total_faturamento_verduras = sum(item['total'] for item in dados_verduras['geral'])
    total_media_verduras = sum(item['media'] for item in dados_verduras['geral']) / len(dados_verduras['geral'])
    total_var_verduras = sum(item['var'] for item in dados_verduras['geral']) / len(dados_verduras['geral'])

    dados_verduras['geral'].append({
        "nome": "TOTAL GERAL",
        "total": total_faturamento_verduras,
        "media": total_media_verduras,
        "var": total_var_verduras
    })
    
    # print("✅ Dados de VERDURAS carregados com sucesso!")
    
except FileNotFoundError:
    # print("❌ Arquivo dados_verduras.json não encontrado!")
    dados_verduras = {"geral": [], "top5": [], "high": [], "low": [], "deep_low": [], "potential": []}
except Exception as e:
    # print(f"❌ Erro ao carregar dados_verduras.json: {e}")
    dados_verduras = {"geral": [], "top5": [], "high": [], "low": [], "deep_low": [], "potential": []}

# =============================================
# FUNÇÕES AUXILIARES PARA VERDURAS
# =============================================

def calcular_metricas_verduras():
    """Calcula métricas específicas para verduras"""
    faturamento_2025 = sum(item['total'] for item in dados_verduras['geral'] if item['nome'] != 'TOTAL GERAL')
    # print(faturamento_2025)
    faturamento_2024 = 76144.23
    
    variacao_fat = ((faturamento_2025 - faturamento_2024) / faturamento_2024) * 100 if faturamento_2024 else 0
    
    volume_2025 = 12995.51
    volume_2024 = 14022.81
    
    variacao_total = ((volume_2025 - volume_2024) / volume_2024) * 100 if volume_2024 else 0
    
    high_performers = [item for item in dados_verduras.get('high', []) if item.get('var', 0) > 0]
    if high_performers:
        top_performer = max(high_performers, key=lambda x: x['var'])
    else:
        positive_items = [item for item in dados_verduras.get('geral', []) if item.get('var', 0) > 0 and item['nome'] != 'TOTAL GERAL']
        top_performer = max(positive_items, key=lambda x: x['var']) if positive_items else {"nome": "N/A", "var": 0}
    
    return {
        "faturamento_2025": faturamento_2025,
        "faturamento_2024": faturamento_2024,
        "variacao_faturamento": variacao_fat,
        "volume_2025": volume_2025,
        "volume_2024": volume_2024,
        "variacao_volume": variacao_total,
        "top_performer": {
            "nome": top_performer['nome'],
            "variacao": top_performer['var']
        }
    }

# =============================================
# ROTAS PARA VERDURAS
# =============================================

@app.route('/verduras')
def dashboard_verduras():
    return render_template('index_verduras.html')

@app.route('/verduras/top5')
def top5_verduras():
    return render_template('top5_verduras.html')

@app.route('/verduras/high')
def high_performance_verduras():
    return render_template('high_performance_verduras.html')

@app.route('/verduras/oportunidades')
def oportunidades_verduras():
    return render_template('oportunidades_verduras.html')

@app.route('/verduras/alertas')
def alertas_verduras():
    return render_template('alertas_verduras.html')

@app.route('/verduras/dados_gerais')
def dados_gerais_verduras():
    return render_template('dados_gerais_verduras.html', dados=dados_verduras)

# =============================================
# APIs PARA VERDURAS
# =============================================

@app.route('/api/verduras/dados')
def api_dados_verduras():
    """API que retorna TODOS os dados + métricas calculadas para o dashboard de verduras"""
    try:
        metricas = calcular_metricas_verduras()
        return jsonify({
            "dados": dados_verduras,
            "metricas": metricas
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/verduras/top5')
def api_top5_verduras():
    """API específica para a página Top5 de verduras"""
    try:
        return jsonify(dados_verduras["top5"])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/verduras/high')
def api_high_verduras():
    """API específica para a página High Performance de verduras"""
    try:
        return jsonify(dados_verduras["high"])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/verduras/chart-data')
def get_chart_data_verduras():
    """API para dados de gráficos específicos de verduras"""
    product_name = request.args.get('product_name')
    chart_type = request.args.get('chart_type')
    
    try:
        # print(f"Debug Verduras: product_name={product_name}, chart_type={chart_type}")
        
        if product_name:
            product = next((item for item in dados_verduras['top5'] if item['nome'] == product_name), None)
            
            if not product:
                return jsonify({'error': 'Produto não encontrado'}), 404
            
            return jsonify({
                'error': 'Dados mensais não disponíveis',
                'message': 'Apenas dados anuais disponíveis',
                'available_data': {
                    'total_2025': product['total'],
                    'media_mensal_2025': product['media'],
                    'variacao_percentual': product['var']
                }
            }), 404
        
        elif chart_type == 'top5_comparison':
            products = [item['nome'] for item in dados_verduras['top5']]
            data_2025 = [item['total'] for item in dados_verduras['top5']]
            
            data_2024 = []
            for item in dados_verduras['top5']:
                var_decimal = item['var'] / 100
                total_2024 = item['total'] / (1 + var_decimal)
                data_2024.append(round(total_2024, 2))
            
            return jsonify({
                'type': 'top5_comparison',
                'products': products,
                'data_2024': data_2024,
                'data_2025': data_2025
            })
        
        elif chart_type == 'top5_averages':
            return jsonify({
                'type': 'top5_averages',
                'products': [item['nome'] for item in dados_verduras['top5']],
                'averages': [item['media'] for item in dados_verduras['top5']],
                'variations': [item['var'] for item in dados_verduras['top5']]
            })
        
        else:
            return jsonify({'error': 'Parâmetros inválidos. Use product_name ou chart_type'}), 400
            
    except Exception as e:
        # print(f"Erro em /api/verduras/chart-data: {str(e)}")
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500




















@app.route('/')
def bi():
    return render_template('bi.html')











if __name__ == '__main__':
    app.run(host="192.168.25.200",port=5560,debug=True)    
    