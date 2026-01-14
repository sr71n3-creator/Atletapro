/* ============================================
   ATHLETE PRO - CORE SYSTEM
   Versão: 3.0.0
   Arquivo: scripts.js
   Função: Sistema central e gerenciador de módulos
   ============================================ */

// ==================== NAMESPACE GLOBAL ====================
window.AthletePro = {
    // Estado do aplicativo
    state: {
        currentModule: 'dashboard',
        userData: null,
        settings: {},
        notifications: [],
        isLoading: false,
        modules: {}
    },
    
    // Configurações padrão
    config: {
        apiUrl: null, // Offline por padrão
        version: '3.0.0',
        cacheTime: 3600000, // 1 hora
        debugMode: false
    },
    
    // Inicialização do sistema
    init: function() {
        console.log('🚀 AthletePro v' + this.config.version + ' inicializando...');
        
        // 1. Carregar configurações
        this.loadSettings();
        
        // 2. Carregar dados do usuário
        this.loadUserData();
        
        // 3. Configurar eventos
        this.setupEventListeners();
        
        // 4. Carregar módulo padrão (dashboard)
        this.loadModule('dashboard');
        
        // 5. Iniciar serviços em background
        this.startBackgroundServices();
        
        // 6. Atualizar estatísticas em tempo real
        this.updateRealTimeStats();
        
        console.log('✅ Sistema AthletePro inicializado com sucesso!');
    },
    
    // ==================== GERENCIAMENTO DE MÓDULOS ====================
    
    // Carregar um módulo dinamicamente
    loadModule: async function(moduleName) {
        try {
            // Validar nome do módulo
            if (!moduleName || typeof moduleName !== 'string') {
                console.error('Nome do módulo inválido:', moduleName);
                return false;
            }
            
            // Verificar se já está carregado
            if (this.state.currentModule === moduleName && this.state.modules[moduleName]) {
                console.log(`Módulo ${moduleName} já está carregado.`);
                this.showModule(moduleName);
                return true;
            }
            
            // Mostrar loading
            this.showLoading(true);
            
            // Atualizar estado
            this.state.currentModule = moduleName;
            this.state.isLoading = true;
            
            // Atualizar navegação ativa
            this.updateActiveNavigation(moduleName);
            
            // Carregar o módulo
            const module = await this.fetchModule(moduleName);
            
            if (module) {
                // Armazenar no cache
                this.state.modules[moduleName] = {
                    html: module.html,
                    js: module.js,
                    css: module.css,
                    timestamp: Date.now()
                };
                
                // Atualizar interface
                this.updatePageHeader(moduleName);
                this.renderModuleContent(module.html);
                
                // Executar JavaScript do módulo
                if (module.js) {
                    this.executeModuleScript(module.js, moduleName);
                }
                
                // Aplicar CSS do módulo
                if (module.css) {
                    this.applyModuleCSS(module.css, moduleName);
                }
                
                console.log(`✅ Módulo ${moduleName} carregado com sucesso.`);
                return true;
            } else {
                console.error(`❌ Falha ao carregar módulo ${moduleName}`);
                this.showError(`Módulo ${moduleName} não disponível.`);
                return false;
            }
        } catch (error) {
            console.error(`Erro ao carregar módulo ${moduleName}:`, error);
            this.showError(`Erro ao carregar ${moduleName}: ${error.message}`);
            return false;
        } finally {
            this.showLoading(false);
            this.state.isLoading = false;
        }
    },
    
    // Buscar módulo (simulação - na prática seria por fetch)
    fetchModule: async function(moduleName) {
        // Em produção, isso buscaria um arquivo .js ou .html
        // Por enquanto, vamos usar um sistema de módulos embutidos
        
        const modules = {
            'dashboard': {
                html: this.getDashboardHTML(),
                js: this.getDashboardJS(),
                css: '',
                title: 'Dashboard de Performance',
                subtitle: 'Monitoramento completo do seu progresso'
            },
            'calculators': {
                html: this.getCalculatorsHTML(),
                js: this.getCalculatorsJS(),
                css: '',
                title: 'Calculadoras de Performance',
                subtitle: 'Ferramentas avançadas para cálculo preciso'
            },
            'steroid-info': {
                html: this.getSteroidInfoHTML(),
                js: '',
                css: '',
                title: 'Informações sobre Esteroides',
                subtitle: 'Banco de dados completo de compostos anabolizantes'
            }
            // Outros módulos serão adicionados depois
        };
        
        return modules[moduleName] || null;
    },
    
    // Mostrar módulo carregado
    showModule: function(moduleName) {
        const module = this.state.modules[moduleName];
        if (!module) {
            console.error(`Módulo ${moduleName} não encontrado no cache.`);
            return false;
        }
        
        this.updateActiveNavigation(moduleName);
        this.updatePageHeader(moduleName);
        this.renderModuleContent(module.html);
        
        return true;
    },
    
    // Atualizar navegação ativa
    updateActiveNavigation: function(moduleName) {
        // Remover classe active de todos os links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Adicionar classe active ao link correspondente
        const activeLink = document.querySelector(`.nav-link[data-module="${moduleName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    },
    
    // Atualizar cabeçalho da página
    updatePageHeader: function(moduleName) {
        const titles = {
            'dashboard': { 
                title: 'Dashboard de Performance',
                subtitle: 'Monitoramento completo do seu progresso e status atual'
            },
            'calculators': { 
                title: 'Calculadoras de Performance',
                subtitle: 'Ferramentas avançadas para cálculo preciso'
            },
            'steroid-info': { 
                title: 'Informações sobre Esteroides',
                subtitle: 'Banco de dados completo de compostos anabolizantes'
            },
            'cycle-planner': { 
                title: 'Planejador de Ciclos',
                subtitle: 'Agenda completa de uso de esteroides'
            },
            'bloodwork': { 
                title: 'Monitoramento de Exames Sanguíneos',
                subtitle: 'Controle de marcadores de saúde durante ciclos'
            },
            'workout-planner': { 
                title: 'Planejador de Treino',
                subtitle: 'Crie programas de treino periodizados'
            },
            'workout-log': { 
                title: 'Registro de Treino',
                subtitle: 'Acompanhe todos os seus treinos'
            },
            'nutrition': { 
                title: 'Diário Nutricional',
                subtitle: 'Acompanhamento de dieta e suplementação'
            },
            'recovery': { 
                title: 'Monitoramento de Recuperação',
                subtitle: 'Acompanhe sua recuperação e saúde geral'
            },
            'reports': { 
                title: 'Relatórios e Análises',
                subtitle: 'Análises detalhadas do seu progresso'
            },
            'community': { 
                title: 'Perfil Social',
                subtitle: 'Conecte-se com outros atletas'
            }
        };
        
        const moduleTitle = titles[moduleName] || { 
            title: moduleName.charAt(0).toUpperCase() + moduleName.slice(1),
            subtitle: 'Módulo do sistema'
        };
        
        // Atualizar título
        const titleEl = document.getElementById('page-title');
        const subtitleEl = document.getElementById('page-subtitle');
        const actionsEl = document.getElementById('page-actions');
        
        if (titleEl) titleEl.textContent = moduleTitle.title;
        if (subtitleEl) subtitleEl.textContent = moduleTitle.subtitle;
        
        // Atualizar botões de ação baseados no módulo
        if (actionsEl) {
            actionsEl.innerHTML = this.getModuleActions(moduleName);
        }
    },
    
    // Renderizar conteúdo do módulo
    renderModuleContent: function(html) {
        const contentEl = document.getElementById('module-content');
        if (!contentEl) {
            console.error('Elemento module-content não encontrado!');
            return;
        }
        
        // Limpar conteúdo anterior
        contentEl.innerHTML = '';
        
        // Adicionar animação de entrada
        contentEl.classList.add('fade-in');
        
        // Inserir novo conteúdo
        if (typeof html === 'string') {
            contentEl.innerHTML = html;
        } else if (typeof html === 'function') {
            contentEl.appendChild(html());
        }
        
        // Remover animação após execução
        setTimeout(() => {
            contentEl.classList.remove('fade-in');
        }, 500);
    },
    
    // Executar JavaScript do módulo
    executeModuleScript: function(script, moduleName) {
        try {
            if (typeof script === 'function') {
                script.call(this, moduleName);
            } else if (typeof script === 'string') {
                // Cria uma função a partir da string
                const func = new Function('moduleName', 'AthletePro', script);
                func.call(this, moduleName, this);
            }
        } catch (error) {
            console.error(`Erro ao executar script do módulo ${moduleName}:`, error);
        }
    },
    
    // Aplicar CSS do módulo
    applyModuleCSS: function(css, moduleName) {
        // Remove CSS anterior do mesmo módulo
        const oldStyle = document.getElementById(`module-css-${moduleName}`);
        if (oldStyle) {
            oldStyle.remove();
        }
        
        // Adiciona novo CSS
        if (css) {
            const style = document.createElement('style');
            style.id = `module-css-${moduleName}`;
            style.textContent = css;
            document.head.appendChild(style);
        }
    },
    
    // ==================== MÓDULOS EMBUTIDOS (HTML/JS) ====================
    
    // Dashboard
    getDashboardHTML: function() {
        return `
            <div class="dashboard-cards">
                <div class="card fade-in">
                    <div class="card-header">
                        <h3 class="card-title">Status de Força</h3>
                        <div class="card-icon">
                            <i class="fas fa-weight-hanging"></i>
                        </div>
                    </div>
                    <div class="chart-container" style="height: 200px;">
                        <canvas id="strengthChart"></canvas>
                    </div>
                    <div class="mt-3">
                        <div class="form-row">
                            <div>
                                <small class="text-success">Agachamento: 215kg (+5kg)</small>
                            </div>
                            <div>
                                <small class="text-success">Supino: 155kg (+2.5kg)</small>
                            </div>
                            <div>
                                <small class="text-success">Terra: 240kg (+7.5kg)</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card fade-in">
                    <div class="card-header">
                        <h3 class="card-title">Status de Recuperação</h3>
                        <div class="card-icon">
                            <i class="fas fa-heartbeat"></i>
                        </div>
                    </div>
                    <div class="text-center">
                        <div class="result-value">86%</div>
                        <p class="text-success">Ótima recuperação</p>
                    </div>
                    <div class="mt-3">
                        <div class="form-row">
                            <div>
                                <small>Sono: 7h45m</small>
                            </div>
                            <div>
                                <small>HRV: 68ms</small>
                            </div>
                            <div>
                                <small>Dor Muscular: 2/10</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card fade-in">
                    <div class="card-header">
                        <h3 class="card-title">Próximo Treino</h3>
                        <div class="card-icon">
                            <i class="fas fa-dumbbell"></i>
                        </div>
                    </div>
                    <div class="mb-3">
                        <h4>Força Máxima - Agachamento</h4>
                        <p class="text-gray">Hoje, 15:00 | Duração: 120min</p>
                    </div>
                    <div class="mb-3">
                        <div class="form-row">
                            <div>
                                <small><strong>Séries:</strong> 5x3 @ 92%</small>
                            </div>
                            <div>
                                <small><strong>RPE:</strong> 8-9</small>
                            </div>
                            <div>
                                <small><strong>Descanso:</strong> 4min</small>
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-primary btn-block" id="start-workout-btn">
                        <i class="fas fa-play"></i> Iniciar Treino
                    </button>
                </div>
            </div>
            
            <div class="chart-container mb-5">
                <div class="chart-header">
                    <h3 class="chart-title">Progresso de Performance (12 semanas)</h3>
                    <select class="form-control" style="width: 200px;" id="progressMetric">
                        <option value="strength">Força Máxima</option>
                        <option value="volume">Volume de Treino</option>
                        <option value="bodyweight">Peso Corporal</option>
                        <option value="bodyfat">Percentual de Gordura</option>
                    </select>
                </div>
                <canvas id="progressChart"></canvas>
            </div>
            
            <div class="chart-container">
                <div class="chart-header">
                    <h3 class="chart-title">Ciclo Atual de Esteroides</h3>
                    <div>
                        <span class="text-accent">Dia 42 de 84</span>
                    </div>
                </div>
                <div class="cycle-phase">
                    <div class="phase-header">
                        <h4 class="phase-title">Fase de Ganho de Massa</h4>
                        <div class="phase-dates">Dia 1-56</div>
                    </div>
                    <div class="compound-list">
                        <div class="compound-item">
                            <i class="fas fa-syringe"></i>
                            <div>
                                <div class="compound-name">Testosterona Enantato</div>
                                <div class="compound-dose">500mg/semana</div>
                            </div>
                        </div>
                        <div class="compound-item">
                            <i class="fas fa-pills"></i>
                            <div>
                                <div class="compound-name">Deca-Durabolin</div>
                                <div class="compound-dose">400mg/semana</div>
                            </div>
                        </div>
                        <div class="compound-item">
                            <i class="fas fa-pills"></i>
                            <div>
                                <div class="compound-name">Dianabol</div>
                                <div class="compound-dose">30mg/dia</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Próxima Aplicação</label>
                        <div class="form-control">Sexta-feira, 15:00</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Medicamentos de Suporte</label>
                        <div class="form-control">Arimidex 0.5mg E3D, Caber 0.25mg 2x/semana</div>
                    </div>
                </div>
            </div>
        `;
    },
    
    getDashboardJS: function() {
        return function(moduleName) {
            console.log(`Executando JavaScript do módulo: ${moduleName}`);
            
            // Inicializar gráficos
            initDashboardCharts();
            
            // Configurar eventos
            document.getElementById('progressMetric').addEventListener('change', function() {
                updateProgressChart(this.value);
            });
            
            document.getElementById('start-workout-btn').addEventListener('click', function() {
                AthletePro.loadModule('workout-log');
            });
            
            // Atualizar estatísticas em tempo real
            updateDashboardStats();
            
            // Funções específicas do dashboard
            function initDashboardCharts() {
                // Gráfico de Força
                const strengthCtx = document.getElementById('strengthChart');
                if (strengthCtx) {
                    new Chart(strengthCtx.getContext('2d'), {
                        type: 'line',
                        data: {
                            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
                            datasets: [{
                                label: 'Agachamento (kg)',
                                data: [180, 185, 190, 195, 200, 205, 210],
                                borderColor: '#e63946',
                                backgroundColor: 'rgba(230, 57, 70, 0.1)',
                                tension: 0.3,
                                fill: true
                            }, {
                                label: 'Supino (kg)',
                                data: [130, 135, 138, 142, 145, 148, 150],
                                borderColor: '#2a9d8f',
                                backgroundColor: 'rgba(42, 157, 143, 0.1)',
                                tension: 0.3,
                                fill: true
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'top' } }
                        }
                    });
                }
                
                // Gráfico de Progresso
                const progressCtx = document.getElementById('progressChart');
                if (progressCtx) {
                    window.progressChart = new Chart(progressCtx.getContext('2d'), {
                        type: 'line',
                        data: {
                            labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 
                                    'Sem 7', 'Sem 8', 'Sem 9', 'Sem 10', 'Sem 11', 'Sem 12'],
                            datasets: [{
                                label: 'Força Máxima (kg)',
                                data: [190, 192, 195, 198, 200, 203, 205, 208, 210, 212, 213, 215],
                                borderColor: '#e63946',
                                borderWidth: 3,
                                tension: 0.4,
                                fill: false
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: { y: { beginAtZero: false, min: 180 } }
                        }
                    });
                }
            }
            
            function updateProgressChart(metric) {
                if (!window.progressChart) return;
                
                let newData, newLabel;
                switch(metric) {
                    case 'volume':
                        newData = [38000, 39200, 40500, 41500, 42500, 43800, 
                                  44500, 45200, 46000, 46800, 47500, 48200];
                        newLabel = 'Volume Semanal (kg)';
                        break;
                    case 'bodyweight':
                        newData = [88, 88.5, 89, 89.5, 90, 90.5, 91, 91.5, 92, 92, 92, 92];
                        newLabel = 'Peso Corporal (kg)';
                        break;
                    case 'bodyfat':
                        newData = [12, 11.8, 11.5, 11.3, 11, 10.8, 10.5, 10.3, 10, 9.8, 9.5, 9.3];
                        newLabel = 'Percentual de Gordura (%)';
                        break;
                    default:
                        newData = [190, 192, 195, 198, 200, 203, 205, 208, 210, 212, 213, 215];
                        newLabel = 'Força Máxima (kg)';
                }
                
                window.progressChart.data.datasets[0].data = newData;
                window.progressChart.data.datasets[0].label = newLabel;
                window.progressChart.update();
            }
            
            function updateDashboardStats() {
                // Atualizar estatísticas do header
                const stats = AthletePro.state.userData?.stats;
                if (stats) {
                    document.getElementById('current-strength').textContent = 
                        (stats.strength || 92.5) + '%';
                    document.getElementById('weekly-volume').textContent = 
                        (stats.volume || 48.2) + 't';
                    document.getElementById('recovery-score').textContent = 
                        (stats.recovery || 86) + '%';
                }
            }
        };
    },
    
    // Calculadoras
    getCalculatorsHTML: function() {
        return `
            <div class="calculator-grid">
                <div class="calculator-card">
                    <h3 class="mb-3"><i class="fas fa-calculator"></i> Calculadora 1RM</h3>
                    <div class="form-group">
                        <label class="form-label">Peso Levantado (kg)</label>
                        <input type="number" id="rm-weight" class="form-control" placeholder="Ex: 100" step="0.5">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Número de Repetições</label>
                        <input type="number" id="rm-reps" class="form-control" placeholder="Ex: 5" max="12">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Fórmula</label>
                        <select id="rm-formula" class="form-control">
                            <option value="epley">Epley (Recomendada)</option>
                            <option value="brzycki">Brzycki</option>
                            <option value="lander">Lander</option>
                            <option value="wathan">Wathan</option>
                            <option value="lombardi">Lombardi</option>
                        </select>
                    </div>
                    <button class="btn btn-primary btn-block" id="calculate-rm">
                        Calcular 1RM
                    </button>
                    
                    <div class="calculator-result" id="rm-result" style="display: none;">
                        <h4 class="text-center">Estimativa de 1RM</h4>
                        <div class="result-value" id="rm-value">0 kg</div>
                        <div class="mt-3">
                            <div class="form-row">
                                <div class="text-center">
                                    <small>85%: <strong id="int85">0 kg</strong></small>
                                </div>
                                <div class="text-center">
                                    <small>90%: <strong id="int90">0 kg</strong></small>
                                </div>
                                <div class="text-center">
                                    <small>95%: <strong id="int95">0 kg</strong></small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="calculator-card">
                    <h3 class="mb-3"><i class="fas fa-weight"></i> Coeficiente Wilks/IPF</h3>
                    <div class="form-group">
                        <label class="form-label">Peso Corporal (kg)</label>
                        <input type="number" id="wilks-weight" class="form-control" placeholder="Ex: 85" step="0.1">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Total do Levantamento (kg)</label>
                        <input type="number" id="wilks-total" class="form-control" placeholder="Agachamento + Supino + Terra">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Gênero</label>
                        <select id="wilks-gender" class="form-control">
                            <option value="male">Masculino</option>
                            <option value="female">Feminino</option>
                        </select>
                    </div>
                    <button class="btn btn-primary btn-block" id="calculate-wilks">
                        Calcular Wilks
                    </button>
                    
                    <div class="calculator-result" id="wilks-result" style="display: none;">
                        <h4 class="text-center">Coeficiente Wilks</h4>
                        <div class="result-value" id="wilks-value">0.00</div>
                        <div class="text-center mt-2">
                            <small>Pontuação padronizada para competições</small>
                        </div>
                    </div>
                </div>
                
                <div class="calculator-card">
                    <h3 class="mb-3"><i class="fas fa-chart-bar"></i> Calculadora de Volume</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Séries</label>
                            <input type="number" id="vol-sets" class="form-control" placeholder="Ex: 4">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Repetições</label>
                            <input type="number" id="vol-reps" class="form-control" placeholder="Ex: 8">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Carga (kg)</label>
                            <input type="number" id="vol-load" class="form-control" placeholder="Ex: 100" step="0.5">
                        </div>
                    </div>
                    <button class="btn btn-primary btn-block" id="calculate-volume">
                        Calcular Volume
                    </button>
                    
                    <div class="calculator-result" id="volume-result" style="display: none;">
                        <h4 class="text-center">Volume de Treino</h4>
                        <div class="result-value" id="volume-value">0 kg</div>
                        <div class="text-center mt-2">
                            <small>Tonelagem total: <strong id="tonnage">0 kg</strong></small>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-5">
                <h3 class="mb-4">Calculadoras Avançadas</h3>
                <div class="calculator-grid">
                    <div class="calculator-card">
                        <h3 class="mb-3"><i class="fas fa-syringe"></i> Calculadora de Dosagem</h3>
                        <div class="form-group">
                            <label class="form-label">Composto</label>
                            <select id="compound" class="form-control">
                                <option value="test">Testosterona</option>
                                <option value="deca">Deca-Durabolin</option>
                                <option value="tren">Trenbolone</option>
                                <option value="eq">Equipoise</option>
                                <option value="anavar">Anavar</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Dosagem Semanal (mg)</label>
                            <input type="number" id="weekly-dose" class="form-control" placeholder="Ex: 500">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Concentração do Óleo (mg/ml)</label>
                            <input type="number" id="concentration" class="form-control" placeholder="Ex: 250" value="250">
                        </div>
                        <button class="btn btn-primary btn-block" id="calculate-dose">
                            Calcular Dosagem
                        </button>
                        
                        <div class="calculator-result" id="dose-result" style="display: none;">
                            <h4 class="text-center">Protocolo de Aplicação</h4>
                            <div class="result-value" id="dose-value">0 ml</div>
                            <div class="text-center mt-2">
                                <small>Por aplicação (2x/semana): <strong id="per-injection">0 ml</strong></small><br>
                                <small>Volume total por ciclo (12 semanas): <strong id="total-volume">0 ml</strong></small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="calculator-card">
                        <h3 class="mb-3"><i class="fas fa-utensils"></i> Calculadora de Macros</h3>
                        <div class="form-group">
                            <label class="form-label">Peso Corporal (kg)</label>
                            <input type="number" id="macro-weight" class="form-control" placeholder="Ex: 85">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Objetivo</label>
                            <select id="macro-goal" class="form-control">
                                <option value="bulk">Bulking (Ganho de Massa)</option>
                                <option value="cut">Cutting (Perda de Gordura)</option>
                                <option value="maintain">Manutenção</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Nível de Atividade</label>
                            <select id="activity-level" class="form-control">
                                <option value="1.2">Sedentário</option>
                                <option value="1.375">Levemente Ativo</option>
                                <option value="1.55">Moderadamente Ativo</option>
                                <option value="1.725" selected>Muito Ativo (Atleta)</option>
                                <option value="1.9">Extremamente Ativo</option>
                            </select>
                        </div>
                        <button class="btn btn-primary btn-block" id="calculate-macros">
                            Calcular Macros
                        </button>
                        
                        <div class="calculator-result" id="macro-result" style="display: none;">
                            <h4 class="text-center">Recomendação Diária</h4>
                            <div class="result-value" id="calories-value">0 kcal</div>
                            <div class="text-center mt-2">
                                <small>Proteínas: <strong id="protein-value">0g</strong></small><br>
                                <small>Carboidratos: <strong id="carbs-value">0g</strong></small><br>
                                <small>Gorduras: <strong id="fat-value">0g</strong></small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="calculator-card">
                        <h3 class="mb-3"><i class="fas fa-brain"></i> Calculadora RPE/RIR</h3>
                        <div class="form-group">
                            <label class="form-label">Nível de Esforço (RPE)</label>
                            <select id="rpe-level" class="form-control">
                                <option value="10">10 - Máximo (0 RIR)</option>
                                <option value="9.5">9.5 - Quase Máximo (0-0.5 RIR)</option>
                                <option value="9">9 - Muito Pesado (1 RIR)</option>
                                <option value="8.5">8.5 - Pesado (1-2 RIR)</option>
                                <option value="8">8 - Moderado (2 RIR)</option>
                                <option value="7">7 - Leve (3 RIR)</option>
                                <option value="6">6 - Muito Leve (4 RIR)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Repetições na Reserva (RIR)</label>
                            <input type="range" id="rir-slider" min="0" max="4" step="0.5" value="2" class="form-control">
                            <div class="text-center">
                                <span id="rir-value">2 RIR</span>
                            </div>
                        </div>
                        <div class="calculator-result">
                            <h4 class="text-center">Interpretação RPE/RIR</h4>
                            <div class="text-center mt-2">
                                <p><strong>RPE 8 = 2 RIR</strong></p>
                                <small>Você poderia fazer mais 2 repetições antes da falha. Intensidade ideal para ganhos consistentes.</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    getCalculatorsJS: function() {
        return function(moduleName) {
            console.log(`Executando JavaScript do módulo: ${moduleName}`);
            
            // Configurar event listeners para calculadoras
            document.getElementById('calculate-rm').addEventListener('click', calculate1RM);
            document.getElementById('calculate-wilks').addEventListener('click', calculateWilks);
            document.getElementById('calculate-volume').addEventListener('click', calculateVolume);
            document.getElementById('calculate-dose').addEventListener('click', calculateDose);
            document.getElementById('calculate-macros').addEventListener('click', calculateMacros);
            
            // Configurar slider RIR
            const rirSlider = document.getElementById('rir-slider');
            if (rirSlider) {
                rirSlider.addEventListener('input', function() {
                    document.getElementById('rir-value').textContent = this.value + ' RIR';
                    updateRPEFromRIR(this.value);
                });
            }
            
            // Funções das calculadoras
            function calculate1RM() {
                const weight = parseFloat(document.getElementById('rm-weight').value);
                const reps = parseInt(document.getElementById('rm-reps').value);
                const formula = document.getElementById('rm-formula').value;
                
                if (!weight || !reps || weight <= 0 || reps <= 0) {
                    AthletePro.showNotification('Por favor, insira valores válidos.', 'warning');
                    return;
                }
                
                let oneRM;
                switch(formula) {
                    case 'epley': oneRM = weight * (1 + (reps / 30)); break;
                    case 'brzycki': oneRM = weight * (36 / (37 - reps)); break;
                    case 'lander': oneRM = (100 * weight) / (101.3 - 2.67123 * reps); break;
                    case 'wathan': oneRM = (100 * weight) / (48.8 + 53.8 * Math.exp(-0.075 * reps)); break;
                    case 'lombardi': oneRM = weight * Math.pow(reps, 0.1); break;
                    default: oneRM = weight * (1 + (reps / 30));
                }
                
                // Arredondar para 1 casa decimal
                oneRM = Math.round(oneRM * 10) / 10;
                
                // Exibir resultado
                document.getElementById('rm-value').textContent = oneRM + ' kg';
                document.getElementById('int85').textContent = Math.round(oneRM * 0.85 * 10) / 10 + ' kg';
                document.getElementById('int90').textContent = Math.round(oneRM * 0.90 * 10) / 10 + ' kg';
                document.getElementById('int95').textContent = Math.round(oneRM * 0.95 * 10) / 10 + ' kg';
                document.getElementById('rm-result').style.display = 'block';
            }
            
            function calculateWilks() {
                const bodyweight = parseFloat(document.getElementById('wilks-weight').value);
                const total = parseFloat(document.getElementById('wilks-total').value);
                const gender = document.getElementById('wilks-gender').value;
                
                if (!bodyweight || !total || bodyweight <= 0 || total <= 0) {
                    AthletePro.showNotification('Por favor, insira valores válidos.', 'warning');
                    return;
                }
                
                let wilks;
                if (gender === 'male') {
                    const a = -216.0475144;
                    const b = 16.2606339;
                    const c = -0.002388645;
                    const d = -0.00113732;
                    const e = 7.01863E-06;
                    const f = -1.291E-08;
                    
                    wilks = total * (500 / (a + (b * bodyweight) + (c * Math.pow(bodyweight, 2)) + 
                        (d * Math.pow(bodyweight, 3)) + (e * Math.pow(bodyweight, 4)) + 
                        (f * Math.pow(bodyweight, 5))));
                } else {
                    const a = 594.31747775582;
                    const b = -27.23842536447;
                    const c = 0.82112226871;
                    const d = -0.00930733913;
                    const e = 4.731582E-05;
                    const f = -9.054E-08;
                    
                    wilks = total * (500 / (a + (b * bodyweight) + (c * Math.pow(bodyweight, 2)) + 
                        (d * Math.pow(bodyweight, 3)) + (e * Math.pow(bodyweight, 4)) + 
                        (f * Math.pow(bodyweight, 5))));
                }
                
                wilks = Math.round(wilks * 100) / 100;
                
                document.getElementById('wilks-value').textContent = wilks;
                document.getElementById('wilks-result').style.display = 'block';
            }
            
            function calculateVolume() {
                const sets = parseInt(document.getElementById('vol-sets').value);
                const reps = parseInt(document.getElementById('vol-reps').value);
                const load = parseFloat(document.getElementById('vol-load').value);
                
                if (!sets || !reps || !load || sets <= 0 || reps <= 0 || load <= 0) {
                    AthletePro.showNotification('Por favor, insira valores válidos.', 'warning');
                    return;
                }
                
                const volume = sets * reps * load;
                const tonnage = volume * 0.001;
                
                document.getElementById('volume-value').textContent = volume.toLocaleString() + ' kg';
                document.getElementById('tonnage').textContent = tonnage.toFixed(2) + ' ton';
                document.getElementById('volume-result').style.display = 'block';
            }
            
            function calculateDose() {
                const weeklyDose = parseFloat(document.getElementById('weekly-dose').value);
                const concentration = parseFloat(document.getElementById('concentration').value);
                
                if (!weeklyDose || !concentration || weeklyDose <= 0 || concentration <= 0) {
                    AthletePro.showNotification('Por favor, insira valores válidos.', 'warning');
                    return;
                }
                
                const weeklyML = weeklyDose / concentration;
                const perInjection = weeklyML / 2;
                const total12Weeks = weeklyML * 12;
                
                document.getElementById('dose-value').textContent = weeklyML.toFixed(2) + ' ml/semana';
                document.getElementById('per-injection').textContent = perInjection.toFixed(2) + ' ml';
                document.getElementById('total-volume').textContent = total12Weeks.toFixed(2) + ' ml';
                document.getElementById('dose-result').style.display = 'block';
            }
            
            function calculateMacros() {
                const weight = parseFloat(document.getElementById('macro-weight').value);
                const goal = document.getElementById('macro-goal').value;
                const activity = parseFloat(document.getElementById('activity-level').value);
                
                if (!weight || weight <= 0) {
                    AthletePro.showNotification('Por favor, insira seu peso corporal.', 'warning');
                    return;
                }
                
                // Cálculo de calorias base
                let bmr = 10 * weight + 6.25 * 180 - 5 * 28 + 5;
                let tdee = bmr * activity;
                
                let calories;
                switch(goal) {
                    case 'bulk': calories = tdee * 1.1; break;
                    case 'cut': calories = tdee * 0.85; break;
                    default: calories = tdee;
                }
                
                const protein = weight * 2.2;
                const fat = (calories * 0.25) / 9;
                const carbs = (calories - (protein * 4) - (fat * 9)) / 4;
                
                calories = Math.round(calories);
                
                document.getElementById('calories-value').textContent = calories.toLocaleString() + ' kcal';
                document.getElementById('protein-value').textContent = Math.round(protein) + 'g';
                document.getElementById('carbs-value').textContent = Math.round(carbs) + 'g';
                document.getElementById('fat-value').textContent = Math.round(fat) + 'g';
                document.getElementById('macro-result').style.display = 'block';
            }
            
            function updateRPEFromRIR(rir) {
                const rpeMap = {
                    '0': '10', '0.5': '9.5', '1': '9', '1.5': '8.5',
                    '2': '8', '3': '7', '4': '6'
                };
                
                const rpeSelect = document.getElementById('rpe-level');
                if (rpeSelect && rpeMap[rir]) {
                    rpeSelect.value = rpeMap[rir];
                }
            }
        };
    },
    
    // Info Esteroides
    getSteroidInfoHTML: function() {
        return `
            <div class="table-container mb-5">
                <table>
                    <thead>
                        <tr>
                            <th>Composto</th>
                            <th>Tipo</th>
                            <th>Meia-vida</th>
                            <th>Dosagem (semanal)</th>
                            <th>Efeitos Principais</th>
                            <th>Efeitos Colaterais</th>
                            <th>Notas</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Testosterona Enantato</strong></td>
                            <td>Esteróide Injetável</td>
                            <td>4.5 dias</td>
                            <td>250-1000mg</td>
                            <td>Ganho de massa, força, libido</td>
                            <td>Acne, calvície, ginecomastia</td>
                            <td>Base de qualquer ciclo</td>
                        </tr>
                        <tr>
                            <td><strong>Deca-Durabolin</strong></td>
                            <td>Esteróide Injetável</td>
                            <td>7 dias</td>
                            <td>200-600mg</td>
                            <td>Ganho de massa, recuperação, articulações</td>
                            <td>Retenção hídrica, prolactina</td>
                            <td>Excelente para volume</td>
                        </tr>
                        <tr>
                            <td><strong>Trenbolone Acetate</strong></td>
                            <td>Esteróide Injetável</td>
                            <td>2-3 dias</td>
                            <td>200-500mg</td>
                            <td>Força extrema, definição</td>
                            <td>Insônia, suor noturno, agressividade</td>
                            <td>Para atletas avançados</td>
                        </tr>
                        <tr>
                            <td><strong>Equipoise</strong></td>
                            <td>Esteróide Injetável</td>
                            <td>14 dias</td>
                            <td>400-800mg</td>
                            <td>Vascularização, resistência</td>
                            <td>Aumento de apetite, hematócrito</td>
                            <td>Longa meia-vida</td>
                        </tr>
                        <tr>
                            <td><strong>Anavar</strong></td>
                            <td>Oral</td>
                            <td>9 horas</td>
                            <td>20-80mg/dia</td>
                            <td>Força, definição, preservação muscular</td>
                            <td>Colesterol, fígado</td>
                            <td>Baixa conversão em estrogênio</td>
                        </tr>
                        <tr>
                            <td><strong>Dianabol</strong></td>
                            <td>Oral</td>
                            <td>4-6 horas</td>
                            <td>20-50mg/dia</td>
                            <td>Ganho de massa rápida, força</td>
                            <td>Retenção hídrica, pressão arterial</td>
                            <td>Kickstart de ciclos</td>
                        </tr>
                        <tr>
                            <td><strong>Winstrol</strong></td>
                            <td>Oral/Injetável</td>
                            <td>9 horas</td>
                            <td>20-50mg/dia</td>
                            <td>Definição, força, densidade muscular</td>
                            <td>Dores articulares, colesterol</td>
                            <td>Para pré-competição</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="chart-container">
                <div class="chart-header">
                    <h3 class="chart-title">Comparativo de Ciclos</h3>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Ciclo para Iniciantes</label>
                        <div class="form-control" style="height: 200px; overflow-y: auto;">
                            <p><strong>Testosterona Enantato:</strong> 500mg/semana (12 semanas)</p>
                            <p><strong>Arimidex:</strong> 0.5mg E3D (se necessário)</p>
                            <p><strong>PCT (após 2 semanas):</strong></p>
                            <ul>
                                <li>Clomid: 50/50/25/25</li>
                                <li>Nolvadex: 40/40/20/20</li>
                            </ul>
                            <p><strong>Ganhos esperados:</strong> 6-8kg de massa magra</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Ciclo Intermediário</label>
                        <div class="form-control" style="height: 200px; overflow-y: auto;">
                            <p><strong>Testosterona Enantato:</strong> 500mg/semana (16 semanas)</p>
                            <p><strong>Deca-Durabolin:</strong> 400mg/semana (14 semanas)</p>
                            <p><strong>Dianabol:</strong> 30mg/dia (4 primeiras semanas)</p>
                            <p><strong>Suporte:</strong> Arimidex 0.5mg E3D, Caber 0.25mg 2x/semana</p>
                            <p><strong>Ganhos esperados:</strong> 10-12kg de massa magra</p>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Ciclo Avançado</label>
                        <div class="form-control" style="height: 200px; overflow-y: auto;">
                            <p><strong>Testosterona Propionato:</strong> 100mg/dia (12 semanas)</p>
                            <p><strong>Trenbolone Acetate:</strong> 50mg/dia (10 semanas)</p>
                            <p><strong>Masteron:</strong> 400mg/semana (12 semanas)</p>
                            <p><strong>Anavar:</strong> 60mg/dia (6 últimas semanas)</p>
                            <p><strong>Suporte completo:</strong> Arimidex, Caber, TUDCA, Telmisartan</p>
                            <p><strong>Ganhos esperados:</strong> Definição extrema, força máxima</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-5">
                <h3 class="mb-4">Medicamentos de Suporte (SERM/AI)</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Medicamento</th>
                                <th>Tipo</th>
                                <th>Dosagem Típica</th>
                                <th>Quando Usar</th>
                                <th>Mecanismo de Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Arimidex (Anastrozol)</strong></td>
                                <td>Inibidor de Aromatase</td>
                                <td>0.5mg E3D</td>
                                <td>Sintomas de estrogênio alto</td>
                                <td>Bloqueia conversão de testosterona em estradiol</td>
                            </tr>
                            <tr>
                                <td><strong>Nolvadex (Tamoxifeno)</strong></td>
                                <td>SERM</td>
                                <td>10-20mg/dia</td>
                                <td>PCT e ginecomastia</td>
                                <td>Bloqueia receptores de estrogênio no peito</td>
                            </tr>
                            <tr>
                                <td><strong>Clomid (Clomifeno)</strong></td>
                                <td>SERM</td>
                                <td>25-50mg/dia</td>
                                <td>PCT</td>
                                <td>Estimula produção de LH/FSH</td>
                            </tr>
                            <tr>
                                <td><strong>Caber (Cabergolina)</strong></td>
                                <td>Agonista de Dopamina</td>
                                <td>0.25mg 2x/semana</td>
                                <td>Prolactina alta (com Deca/Tren)</td>
                                <td>Reduz níveis de prolactina</td>
                            </tr>
                            <tr>
                                <td><strong>TUDCA</strong></td>
                                <td>Hepatoprotetor</td>
                                <td>500mg/dia</td>
                                <td>Ciclos com orais hepatotóxicos</td>
                                <td>Protege e regenera células hepáticas</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },
    
    // ==================== FUNÇÕES UTILITÁRIAS ====================
    
    // Obter ações do módulo (botões)
    getModuleActions: function(moduleName) {
        const actions = {
            'dashboard': `
                <button class="btn btn-primary" id="new-workout-action">
                    <i class="fas fa-plus"></i> Novo Treino
                </button>
                <button class="btn btn-secondary" id="export-data-action">
                    <i class="fas fa-download"></i> Exportar Dados
                </button>
            `,
            'workout-planner': `
                <button class="btn btn-primary" id="new-program-action">
                    <i class="fas fa-plus"></i> Novo Programa
                </button>
            `,
            'workout-log': `
                <button class="btn btn-primary" id="start-workout-action">
                    <i class="fas fa-plus"></i> Novo Treino
                </button>
            `,
            'nutrition': `
                <button class="btn btn-primary" id="new-meal-action">
                    <i class="fas fa-plus"></i> Nova Refeição
                </button>
            `,
            'reports': `
                <button class="btn btn-primary" id="export-report-action">
                    <i class="fas fa-download"></i> Exportar Relatório
                </button>
            `,
            'cycle-planner': `
                <button class="btn btn-primary" id="new-cycle-action">
                    <i class="fas fa-plus"></i> Novo Ciclo
                </button>
            `,
            'bloodwork': `
                <button class="btn btn-primary" id="add-bloodwork-action">
                    <i class="fas fa-plus"></i> Adicionar Exame
                </button>
            `
        };
        
        return actions[moduleName] || '';
    },
    
    // ==================== GERENCIAMENTO DE DADOS ====================
    
    // Carregar configurações
    loadSettings: function() {
        try {
            const saved = localStorage.getItem('athletePro_settings');
            if (saved) {
                this.state.settings = JSON.parse(saved);
            } else {
                // Configurações padrão
                this.state.settings = {
                    theme: 'dark',
                    units: 'metric',
                    notifications: true,
                    autoSave: true,
                    offlineMode: true
                };
                this.saveSettings();
            }
            
            // Aplicar configurações
            this.applySettings();
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    },
    
    // Salvar configurações
    saveSettings: function() {
        try {
            localStorage.setItem('athletePro_settings', JSON.stringify(this.state.settings));
            return true;
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            return false;
        }
    },
    
    // Aplicar configurações
    applySettings: function() {
        // Aplicar tema
        document.body.className = '';
        if (this.state.settings.theme && this.state.settings.theme !== 'dark') {
            document.body.classList.add(`theme-${this.state.settings.theme}`);
        }
        
        // Aplicar outras configurações
        // (serão aplicadas quando implementadas)
    },
    
    // Carregar dados do usuário
    loadUserData: function() {
        try {
            const saved = localStorage.getItem('athletePro_userData');
            if (saved) {
                this.state.userData = JSON.parse(saved);
            } else {
                // Dados padrão do usuário
                this.state.userData = {
                    profile: {
                        name: 'Atleta Pro',
                        weight: 92,
                        height: 180,
                        age: 28,
                        experience: 10,
                        level: 'Elite'
                    },
                    stats: {
                        strength: 92.5,
                        volume: 48.2,
                        recovery: 86,
                        nextCycle: 14
                    },
                    workouts: [],
                    nutrition: [],
                    cycles: [],
                    bloodwork: []
                };
                this.saveUserData();
            }
            
            // Atualizar interface com dados do usuário
            this.updateUserInterface();
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
        }
    },
    
    // Salvar dados do usuário
    saveUserData: function() {
        try {
            localStorage.setItem('athletePro_userData', JSON.stringify(this.state.userData));
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados do usuário:', error);
            return false;
        }
    },
    
    // Atualizar interface do usuário
    updateUserInterface: function() {
        const user = this.state.userData?.profile;
        if (!user) return;
        
        // Atualizar avatar do modal
        document.getElementById('user-weight').textContent = user.weight + 'kg';
        document.getElementById('user-height').textContent = user.height + 'cm';
        document.getElementById('user-age').textContent = user.age + ' anos';
        document.getElementById('user-experience').textContent = user.experience + ' anos';
    },
    
    // ==================== GERENCIAMENTO DE EVENTOS ====================
    
    // Configurar event listeners
    setupEventListeners: function() {
        // Navegação da sidebar
        document.querySelectorAll('.nav-link[data-module]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const moduleName = link.getAttribute('data-module');
                this.loadModule(moduleName);
            });
        });
        
        // Notificações
        const notificationToggle = document.getElementById('notification-toggle');
        if (notificationToggle) {
            notificationToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNotifications();
            });
        }
        
        // Usuário
        const userToggle = document.getElementById('user-toggle');
        if (userToggle) {
            userToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserModal();
            });
        }
        
        // Configurações do usuário
        const userSettings = document.getElementById('user-settings');
        if (userSettings) {
            userSettings.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }
        
        // Logout
        const userLogout = document.getElementById('user-logout');
        if (userLogout) {
            userLogout.addEventListener('click', () => {
                if (confirm('Tem certeza que deseja sair?')) {
                    this.logout();
                }
            });
        }
        
        // Configurações - salvar
        const saveSettings = document.getElementById('save-settings');
        if (saveSettings) {
            saveSettings.addEventListener('click', () => {
                this.saveSettingsFromModal();
            });
        }
        
        // Configurações - cancelar
        const cancelSettings = document.getElementById('cancel-settings');
        if (cancelSettings) {
            cancelSettings.addEventListener('click', () => {
                this.hideSettingsModal();
            });
        }
        
        // Overlay - fecha modais
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.hideAllModals();
            });
        }
        
        // Exportar dados
        const exportData = document.getElementById('export-data');
        if (exportData) {
            exportData.addEventListener('click', () => {
                this.exportAllData();
            });
        }
        
        // Importar dados
        const importData = document.getElementById('import-data');
        if (importData) {
            importData.addEventListener('click', () => {
                this.importData();
            });
        }
        
        // Resetar dados
        const resetData = document.getElementById('reset-data');
        if (resetData) {
            resetData.addEventListener('click', () => {
                this.resetData();
            });
        }
        
        // Fechar modais com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
        });
        
        // Prevenir fechamento ao clicar dentro do modal
        document.querySelectorAll('.notification-panel, .user-modal, .settings-modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
    },
    
    // ==================== GERENCIAMENTO DE MODAIS ====================
    
    // Mostrar/ocultar notificações
    toggleNotifications: function() {
        const panel = document.getElementById('notification-panel');
        const userModal = document.getElementById('user-modal');
        const settingsModal = document.getElementById('settings-modal');
        const overlay = document.getElementById('overlay');
        
        if (panel.style.display === 'block') {
            panel.style.display = 'none';
            overlay.style.display = 'none';
        } else {
            panel.style.display = 'block';
            userModal.style.display = 'none';
            settingsModal.style.display = 'none';
            overlay.style.display = 'block';
            this.updateNotifications();
        }
    },
    
    // Mostrar/ocultar modal do usuário
    toggleUserModal: function() {
        const modal = document.getElementById('user-modal');
        const notificationPanel = document.getElementById('notification-panel');
        const settingsModal = document.getElementById('settings-modal');
        const overlay = document.getElementById('overlay');
        
        if (modal.style.display === 'block') {
            modal.style.display = 'none';
            overlay.style.display = 'none';
        } else {
            modal.style.display = 'block';
            notificationPanel.style.display = 'none';
            settingsModal.style.display = 'none';
            overlay.style.display = 'block';
        }
    },
    
    // Mostrar modal de configurações
    showSettingsModal: function() {
        const modal = document.getElementById('settings-modal');
        const notificationPanel = document.getElementById('notification-panel');
        const userModal = document.getElementById('user-modal');
        const overlay = document.getElementById('overlay');
        
        // Preencher formulário com configurações atuais
        document.getElementById('theme-select').value = this.state.settings.theme || 'dark';
        document.getElementById('unit-select').value = this.state.settings.units || 'metric';
        document.getElementById('notifications-enabled').checked = this.state.settings.notifications !== false;
        document.getElementById('auto-save-enabled').checked = this.state.settings.autoSave !== false;
        document.getElementById('offline-mode').checked = this.state.settings.offlineMode !== false;
        
        modal.style.display = 'block';
        notificationPanel.style.display = 'none';
        userModal.style.display = 'none';
        overlay.style.display = 'block';
    },
    
    // Ocultar modal de configurações
    hideSettingsModal: function() {
        document.getElementById('settings-modal').style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
    },
    
    // Ocultar todos os modais
    hideAllModals: function() {
        document.getElementById('notification-panel').style.display = 'none';
        document.getElementById('user-modal').style.display = 'none';
        document.getElementById('settings-modal').style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
    },
    
    // Salvar configurações do modal
    saveSettingsFromModal: function() {
        try {
            this.state.settings = {
                theme: document.getElementById('theme-select').value,
                units: document.getElementById('unit-select').value,
                notifications: document.getElementById('notifications-enabled').checked,
                autoSave: document.getElementById('auto-save-enabled').checked,
                offlineMode: document.getElementById('offline-mode').checked
            };
            
            this.saveSettings();
            this.applySettings();
            this.hideSettingsModal();
            
            this.showNotification('Configurações salvas com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            this.showNotification('Erro ao salvar configurações', 'error');
        }
    },
    
    // ==================== NOTIFICAÇÕES ====================
    
    // Atualizar lista de notificações
    updateNotifications: function() {
        const notificationList = document.getElementById('notification-list');
        if (!notificationList) return;
        
        // Notificações de exemplo
        const notifications = [
            {
                type: 'injection',
                message: 'Aplicação Hoje',
                details: 'Testosterona Enantato - 1ml (250mg)',
                time: '15:00 | Glúteo esquerdo'
            },
            {
                type: 'workout',
                message: 'Treino Pendente',
                details: 'Força Máxima - Agachamento',
                time: 'Hoje às 15:00 | 120min'
            },
            {
                type: 'medication',
                message: 'Medicamento',
                details: 'Arimidex 0.5mg devido hoje',
                time: 'Após o treino'
            }
        ];
        
        let html = '';
        notifications.forEach(notif => {
            const icon = notif.type === 'injection' ? 'fa-syringe' : 
                        notif.type === 'workout' ? 'fa-dumbbell' : 'fa-pills';
            const color = notif.type === 'injection' ? 'text-accent' : 
                         notif.type === 'workout' ? 'text-success' : 'text-warning';
            
            html += `
                <div class="notification-item">
                    <strong><i class="fas ${icon} ${color}"></i> ${notif.message}</strong>
                    <p>${notif.details}</p>
                    <small>${notif.time}</small>
                </div>
            `;
        });
        
        notificationList.innerHTML = html;
        
        // Atualizar contador
        const countEl = document.querySelector('.notification-count');
        if (countEl) {
            countEl.textContent = notifications.length;
        }
    },
    
    // Mostrar notificação toast
    showNotification: function(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="close-btn">&times;</button>
        `;
        
        // Adicionar ao corpo
        document.body.appendChild(notification);
        
        // Estilos inline
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 9999;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
        `;
        
        // Botão fechar
        notification.querySelector('.close-btn').addEventListener('click', () => {
            notification.remove();
        });
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        // Adicionar estilos de animação se não existirem
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                .notification-toast .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    margin-left: auto;
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    getNotificationIcon: function(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    },
    
    getNotificationColor: function(type) {
        const colors = {
            'success': '#2a9d8f',
            'error': '#e63946',
            'warning': '#e9c46a',
            'info': '#457b9d'
        };
        return colors[type] || '#457b9d';
    },
    
    // ==================== SERVIÇOS EM BACKGROUND ====================
    
    // Iniciar serviços em background
    startBackgroundServices: function() {
        // Atualizar estatísticas periodicamente
        setInterval(() => {
            this.updateRealTimeStats();
        }, 60000); // A cada minuto
        
        // Verificar notificações pendentes
        setInterval(() => {
            this.checkPendingNotifications();
        }, 300000); // A cada 5 minutos
        
        // Auto-save (se habilitado)
        if (this.state.settings.autoSave) {
            setInterval(() => {
                this.autoSave();
            }, 30000); // A cada 30 segundos
        }
        
        console.log('🔧 Serviços em background iniciados.');
    },
    
    // Atualizar estatísticas em tempo real
    updateRealTimeStats: function() {
        // Atualizar data/hora
        this.updateDateTime();
        
        // Atualizar estatísticas do header
        if (this.state.userData?.stats) {
            document.getElementById('current-strength').textContent = 
                this.state.userData.stats.strength + '%';
            document.getElementById('weekly-volume').textContent = 
                this.state.userData.stats.volume + 't';
            document.getElementById('recovery-score').textContent = 
                this.state.userData.stats.recovery + '%';
            document.getElementById('next-cycle').textContent = 
                this.state.userData.stats.nextCycle;
        }
    },
    
    // Atualizar data e hora
    updateDateTime: function() {
        // Esta função pode ser expandida para mostrar data/hora em algum lugar
        const now = new Date();
        // Exemplo: document.getElementById('current-time').textContent = now.toLocaleTimeString();
    },
    
    // Verificar notificações pendentes
    checkPendingNotifications: function() {
        if (!this.state.settings.notifications) return;
        
        const notifications = [];
        const now = new Date();
        
        // Verificar aplicações pendentes (exemplo)
        if (this.state.userData?.cycles?.length > 0) {
            const lastCycle = this.state.userData.cycles[this.state.userData.cycles.length - 1];
            // Lógica para verificar próximas aplicações
        }
        
        // Verificar treinos pendentes
        if (this.state.userData?.workouts?.length > 0) {
            const lastWorkout = this.state.userData.workouts[this.state.userData.workouts.length - 1];
            // Lógica para verificar próximos treinos
        }
        
        // Atualizar contador
        const countEl = document.querySelector('.notification-count');
        if (countEl) {
            countEl.textContent = notifications.length;
        }
    },
    
    // Auto-save
    autoSave: function() {
        if (this.state.settings.autoSave) {
            this.saveUserData();
            // Silencioso - não mostrar notificação
        }
    },
    
    // ==================== GERENCIAMENTO DE DADOS ====================
    
    // Exportar todos os dados
    exportAllData: function() {
        try {
            const data = {
                userData: this.state.userData,
                settings: this.state.settings,
                modules: Object.keys(this.state.modules),
                exportDate: new Date().toISOString(),
                version: this.config.version
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(dataBlob);
            downloadLink.download = `athlete-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
            
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            this.showNotification('Dados exportados com sucesso!', 'success');
            return true;
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            this.showNotification('Erro ao exportar dados', 'error');
            return false;
        }
    },
    
    // Importar dados
    importData: function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (confirm('Deseja importar todos os dados? Isso substituirá os dados atuais.')) {
                        if (data.userData) this.state.userData = data.userData;
                        if (data.settings) this.state.settings = data.settings;
                        
                        this.saveUserData();
                        this.saveSettings();
                        this.applySettings();
                        
                        this.showNotification('Dados importados com sucesso!', 'success');
                        setTimeout(() => location.reload(), 1000);
                    }
                } catch (error) {
                    console.error('Erro ao importar dados:', error);
                    this.showNotification('Arquivo de backup inválido!', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    },
    
    // Resetar dados
    resetData: function() {
        if (confirm('ATENÇÃO: Esta ação apagará TODOS os seus dados permanentemente. Tem certeza?')) {
            if (confirm('CONFIRMAÇÃO FINAL: Todos os dados serão perdidos. Continuar?')) {
                localStorage.clear();
                this.showNotification('Todos os dados foram apagados. A página será recarregada.', 'warning');
                setTimeout(() => location.reload(), 2000);
            }
        }
    },
    
    // Logout
    logout: function() {
        // Em um sistema real, aqui limparíamos tokens, etc.
        this.showNotification('Logout realizado com sucesso.', 'info');
        setTimeout(() => {
            // Recarregar para estado inicial
            location.reload();
        }, 1000);
    },
    
    // ==================== UTILITÁRIOS DE UI ====================
    
    // Mostrar loading
    showLoading: function(show) {
        const loadingEl = document.getElementById('loading-message');
        if (!loadingEl) return;
        
        if (show) {
            loadingEl.style.display = 'block';
            loadingEl.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-spinner fa-spin fa-3x text-accent"></i>
                    <h3 class="mt-4">Carregando módulo...</h3>
                    <p class="text-gray">Por favor, aguarde</p>
                </div>
            `;
        } else {
            loadingEl.style.display = 'none';
        }
    },
    
    // Mostrar erro
    showError: function(message) {
        const contentEl = document.getElementById('module-content');
        if (!contentEl) return;
        
        contentEl.innerHTML = `
            <div class="text-center text-danger">
                <i class="fas fa-exclamation-triangle fa-3x"></i>
                <h3 class="mt-4">Erro ao carregar</h3>
                <p>${message}</p>
                <button class="btn btn-primary mt-3" onclick="AthletePro.loadModule('dashboard')">
                    <i class="fas fa-home"></i> Voltar ao Dashboard
                </button>
            </div>
        `;
    },
    
    // ==================== FUNÇÕES GLOBAIS ÚTEIS ====================
    
    // Calcular 1RM (disponível globalmente)
    calculateOneRepMax: function(weight, reps, formula = 'epley') {
        switch(formula) {
            case 'epley': return weight * (1 + (reps / 30));
            case 'brzycki': return weight * (36 / (37 - reps));
            case 'lander': return (100 * weight) / (101.3 - 2.67123 * reps);
            case 'wathan': return (100 * weight) / (48.8 + 53.8 * Math.exp(-0.075 * reps));
            case 'lombardi': return weight * Math.pow(reps, 0.1);
            default: return weight * (1 + (reps / 30));
        }
    },
    
    // Converter kg para lbs
    kgToLbs: function(kg) {
        return kg * 2.20462;
    },
    
    // Converter lbs para kg
    lbsToKg: function(lbs) {
        return lbs / 2.20462;
    },
    
    // Formatar data
    formatDate: function(date, format = 'pt-BR') {
        const d = new Date(date);
        return d.toLocaleDateString(format);
    },
    
    // Validar email
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Sanitizar entrada do usuário
    sanitizeInput: function(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    },
    
    // Debounce function
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle function
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// ==================== INICIALIZAÇÃO AUTOMÁTICA ====================
// O sistema será inicializado quando o DOM estiver pronto
// Ver linha 1359 do index.html: document.addEventListener('DOMContentLoaded', ...)

// ==================== EXPORTAÇÃO PARA USO GLOBAL ====================
// Torna as funções principais disponíveis globalmente
window.loadModule = AthletePro.loadModule.bind(AthletePro);
window.showNotification = AthletePro.showNotification.bind(AthletePro);
window.calculateOneRepMax = AthletePro.calculateOneRepMax.bind(AthletePro);

console.log('📦 AthletePro Core carregado. Versão: ' + AthletePro.config.version);
