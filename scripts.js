// ==================== ATHLETE PRO - CORE SCRIPT ====================
// Sistema de Performance para Atletas de Elite
// Versão: 1.0.0
// ===================================================================

// ==================== CONFIGURAÇÕES GLOBAIS ====================
const AthletePro = {
    // Configurações do sistema
    config: {
        appName: 'ATHLETE PRO',
        version: '1.0.0',
        defaultModule: 'dashboard',
        localStoragePrefix: 'athletePro_',
        apiUrl: null, // Para futura integração com backend
        debug: false
    },

    // Estado da aplicação
    state: {
        currentModule: null,
        modules: {},
        user: null,
        settings: {
            theme: 'dark',
            units: 'metric',
            notifications: true,
            autoSave: true,
            offlineMode: false
        },
        data: {
            workouts: [],
            nutrition: [],
            recovery: [],
            injuries: [],
            programs: [],
            bloodwork: [],
            cycle: [],
            conversions: []
        }
    },

    // Elementos DOM importantes
    dom: {
        sidebar: null,
        contentArea: null,
        moduleContent: null,
        pageTitle: null,
        pageSubtitle: null,
        pageActions: null,
        notificationPanel: null,
        userModal: null,
        settingsModal: null,
        overlay: null
    },

    // ==================== INICIALIZAÇÃO ====================
    init: function() {
        console.log(`${this.config.appName} v${this.config.version} inicializando...`);
        
        // Inicializar elementos DOM
        this.initDOM();
        
        // Carregar configurações salvas
        this.loadSettings();
        
        // Carregar dados do usuário
        this.loadUserData();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Carregar módulo padrão
        this.loadModule(this.config.defaultModule);
        
        // Atualizar estatísticas do header
        this.updateHeaderStats();
        
        // Configurar notificações
        this.setupNotifications();
        
        console.log(`${this.config.appName} inicializado com sucesso!`);
        
        // Esconder mensagem de carregamento
        setTimeout(() => {
            const loading = document.getElementById('loading-message');
            if (loading) loading.style.display = 'none';
        }, 500);
    },

    // ==================== GERENCIAMENTO DO DOM ====================
    initDOM: function() {
        this.dom.sidebar = document.getElementById('sidebar');
        this.dom.contentArea = document.getElementById('content-area');
        this.dom.moduleContent = document.getElementById('module-content');
        this.dom.pageTitle = document.getElementById('page-title');
        this.dom.pageSubtitle = document.getElementById('page-subtitle');
        this.dom.pageActions = document.getElementById('page-actions');
        this.dom.notificationPanel = document.getElementById('notification-panel');
        this.dom.userModal = document.getElementById('user-modal');
        this.dom.settingsModal = document.getElementById('settings-modal');
        this.dom.overlay = document.getElementById('overlay');
    },

    // ==================== GERENCIAMENTO DE MÓDULOS ====================
    loadModule: function(moduleName) {
        // Se já estiver carregado, apenas mostra
        if (this.state.modules[moduleName] && this.state.currentModule === moduleName) {
            return;
        }

        // Atualizar estado
        this.state.currentModule = moduleName;

        // Atualizar menu ativo
        this.updateActiveMenu(moduleName);

        // Mostrar loading
        this.showLoading();

        // Carregar módulo dinamicamente
        this.loadModuleFile(moduleName)
            .then(module => {
                // Esconder loading
                this.hideLoading();

                // Renderizar módulo
                if (module && typeof module.render === 'function') {
                    module.render();
                    
                    // Atualizar título da página
                    if (module.title) {
                        this.dom.pageTitle.textContent = module.title;
                    }
                    
                    if (module.subtitle) {
                        this.dom.pageSubtitle.textContent = module.subtitle;
                    }
                    
                    // Atualizar botões de ação
                    this.updatePageActions(module.actions);
                    
                    // Configurar eventos do módulo
                    if (typeof module.setupEvents === 'function') {
                        module.setupEvents();
                    }
                    
                    // Salvar módulo no estado
                    this.state.modules[moduleName] = module;
                    
                    // Rolar para o topo
                    window.scrollTo(0, 0);
                }
            })
            .catch(error => {
                console.error(`Erro ao carregar módulo ${moduleName}:`, error);
                this.hideLoading();
                this.showError(`Erro ao carregar ${moduleName}`);
            });
    },

    loadModuleFile: function(moduleName) {
        return new Promise((resolve, reject) => {
            // Verificar se o módulo já está carregado
            if (this.state.modules[moduleName]) {
                resolve(this.state.modules[moduleName]);
                return;
            }

            // Tentar carregar o arquivo do módulo
            const script = document.createElement('script');
            script.src = `modules/${moduleName}.js`;
            script.type = 'module'; // Usar módulos ES6
            
            script.onload = () => {
                // O módulo deve se registrar globalmente
                if (window.AthleteProModules && window.AthleteProModules[moduleName]) {
                    resolve(window.AthleteProModules[moduleName]);
                } else {
                    reject(new Error(`Módulo ${moduleName} não se registrou corretamente`));
                }
            };
            
            script.onerror = () => {
                // Se o arquivo não existir, carregar módulo padrão
                if (moduleName !== 'dashboard') {
                    this.loadModule('dashboard');
                    reject(new Error(`Arquivo do módulo ${moduleName} não encontrado`));
                } else {
                    // Fallback para dashboard embutido
                    resolve(this.getFallbackModule());
                }
            };
            
            document.head.appendChild(script);
        });
    },

    getFallbackModule: function() {
        // Módulo de fallback (dashboard básico)
        return {
            title: 'Dashboard de Performance',
            subtitle: 'Sistema em carregamento...',
            render: function() {
                const content = document.getElementById('module-content');
                content.innerHTML = `
                    <div class="text-center fade-in" style="padding: 50px 20px;">
                        <i class="fas fa-dumbbell fa-4x text-accent mb-4"></i>
                        <h3 class="mb-3">ATHLETE PRO</h3>
                        <p class="mb-4">Sistema de Performance para Atletas de Elite</p>
                        <div class="dashboard-cards">
                            <div class="card">
                                <div class="card-header">
                                    <h3 class="card-title">Bem-vindo</h3>
                                    <div class="card-icon">
                                        <i class="fas fa-user"></i>
                                    </div>
                                </div>
                                <p>O sistema está carregando. Aguarde um momento.</p>
                            </div>
                        </div>
                    </div>
                `;
            },
            setupEvents: function() {}
        };
    },

    updateActiveMenu: function(moduleName) {
        // Remover classe active de todos os links
        const links = document.querySelectorAll('.nav-link');
        links.forEach(link => link.classList.remove('active'));
        
        // Adicionar classe active ao link correspondente
        const activeLink = document.querySelector(`.nav-link[data-module="${moduleName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    },

    updatePageActions: function(actions) {
        const container = this.dom.pageActions;
        container.innerHTML = '';
        
        if (actions && Array.isArray(actions)) {
            actions.forEach(action => {
                const btn = document.createElement('button');
                btn.className = `btn ${action.class || 'btn-primary'}`;
                btn.innerHTML = action.icon ? `<i class="${action.icon}"></i> ${action.text}` : action.text;
                
                if (action.onClick) {
                    btn.addEventListener('click', action.onClick);
                }
                
                container.appendChild(btn);
            });
        }
    },

    showLoading: function() {
        const content = this.dom.moduleContent;
        content.innerHTML = `
            <div class="text-center" style="padding: 100px 20px;">
                <i class="fas fa-spinner fa-spin fa-3x text-accent"></i>
                <h3 class="mt-4">Carregando...</h3>
            </div>
        `;
    },

    hideLoading: function() {
        // O conteúdo será substituído pelo módulo
    },

    showError: function(message) {
        const content = this.dom.moduleContent;
        content.innerHTML = `
            <div class="text-center fade-in" style="padding: 50px 20px;">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-4"></i>
                <h3 class="mb-3">Erro</h3>
                <p class="mb-4">${message}</p>
                <button class="btn btn-primary" onclick="AthletePro.loadModule('dashboard')">
                    <i class="fas fa-home"></i> Voltar ao Dashboard
                </button>
            </div>
        `;
    },

    // ==================== GERENCIAMENTO DE DADOS ====================
    loadUserData: function() {
        // Carregar dados do localStorage
        const savedUser = localStorage.getItem(this.config.localStoragePrefix + 'user');
        if (savedUser) {
            try {
                this.state.user = JSON.parse(savedUser);
            } catch (e) {
                console.error('Erro ao carregar dados do usuário:', e);
                this.state.user = this.getDefaultUser();
            }
        } else {
            this.state.user = this.getDefaultUser();
            this.saveUserData();
        }

        // Carregar todos os dados
        Object.keys(this.state.data).forEach(key => {
            const saved = localStorage.getItem(this.config.localStoragePrefix + key);
            if (saved) {
                try {
                    this.state.data[key] = JSON.parse(saved);
                } catch (e) {
                    console.error(`Erro ao carregar ${key}:`, e);
                    this.state.data[key] = [];
                }
            }
        });
    },

    getDefaultUser: function() {
        return {
            name: 'Atleta Pro',
            initials: 'AP',
            weight: 92,
            height: 180,
            age: 28,
            experience: 10,
            level: 'Elite',
            lastLogin: new Date().toISOString()
        };
    },

    saveUserData: function() {
        if (!this.state.user) return;
        
        localStorage.setItem(
            this.config.localStoragePrefix + 'user',
            JSON.stringify(this.state.user)
        );
    },

    saveData: function(key, data) {
        if (!key || !this.state.data.hasOwnProperty(key)) {
            console.error('Chave de dados inválida:', key);
            return;
        }
        
        this.state.data[key] = data;
        localStorage.setItem(
            this.config.localStoragePrefix + key,
            JSON.stringify(data)
        );
    },

    getData: function(key) {
        if (!key || !this.state.data.hasOwnProperty(key)) {
            console.error('Chave de dados inválida:', key);
            return null;
        }
        
        return this.state.data[key];
    },

    addData: function(key, item) {
        if (!key || !this.state.data.hasOwnProperty(key)) {
            console.error('Chave de dados inválida:', key);
            return;
        }
        
        this.state.data[key].push(item);
        this.saveData(key, this.state.data[key]);
    },

    // ==================== CONFIGURAÇÕES ====================
    loadSettings: function() {
        const saved = localStorage.getItem(this.config.localStoragePrefix + 'settings');
        if (saved) {
            try {
                this.state.settings = { ...this.state.settings, ...JSON.parse(saved) };
                this.applySettings();
            } catch (e) {
                console.error('Erro ao carregar configurações:', e);
            }
        }
    },

    saveSettings: function() {
        localStorage.setItem(
            this.config.localStoragePrefix + 'settings',
            JSON.stringify(this.state.settings)
        );
        this.applySettings();
    },

    applySettings: function() {
        // Aplicar tema
        document.body.className = '';
        if (this.state.settings.theme !== 'dark') {
            document.body.classList.add(`theme-${this.state.settings.theme}`);
        }
        
        // Aplicar outras configurações...
        // (unidades, notificações, etc.)
    },

    // ==================== NOTIFICAÇÕES ====================
    setupNotifications: function() {
        // Verificar notificações a cada minuto
        setInterval(() => this.checkNotifications(), 60000);
        this.checkNotifications();
    },

    checkNotifications: function() {
        const notifications = [];
        const now = new Date();
        
        // Verificar aplicações pendentes
        const cycle = this.getData('cycle');
        if (cycle && cycle.length > 0) {
            const lastInjection = new Date(cycle[cycle.length - 1].date);
            const daysSince = Math.floor((now - lastInjection) / (1000 * 60 * 60 * 24));
            
            if (daysSince >= 2) {
                notifications.push({
                    id: 'injection-due',
                    type: 'warning',
                    title: 'Aplicação pendente',
                    message: `Última aplicação há ${daysSince} dias`,
                    time: 'Hoje',
                    icon: 'fa-syringe'
                });
            }
        }
        
        // Verificar treinos pendentes
        const workouts = this.getData('workouts');
        if (workouts && workouts.length > 0) {
            const lastWorkout = new Date(workouts[workouts.length - 1].date);
            const daysSinceWorkout = Math.floor((now - lastWorkout) / (1000 * 60 * 60 * 24));
            
            if (daysSinceWorkout >= 2) {
                notifications.push({
                    id: 'workout-due',
                    type: 'info',
                    title: 'Treino pendente',
                    message: `${daysSinceWorkout} dias sem treinar`,
                    time: 'Hoje',
                    icon: 'fa-dumbbell'
                });
            }
        }
        
        // Verificar exames pendentes
        const bloodwork = this.getData('bloodwork');
        if (bloodwork && bloodwork.length > 0) {
            const lastBloodwork = new Date(bloodwork[bloodwork.length - 1].date);
            const weeksSince = Math.floor((now - lastBloodwork) / (1000 * 60 * 60 * 24 * 7));
            
            if (weeksSince >= 8) {
                notifications.push({
                    id: 'bloodwork-due',
                    type: 'danger',
                    title: 'Exames atrasados',
                    message: `${weeksSince} semanas desde o último exame`,
                    time: 'Urgente',
                    icon: 'fa-vial'
                });
            }
        }
        
        // Atualizar contador
        const countElement = document.querySelector('.notification-count');
        if (countElement) {
            countElement.textContent = notifications.length;
        }
        
        // Atualizar painel
        this.updateNotificationPanel(notifications);
    },

    updateNotificationPanel: function(notifications) {
        const panel = document.getElementById('notification-list');
        if (!panel) return;
        
        if (notifications.length === 0) {
            panel.innerHTML = '<p class="text-center text-gray">Nenhuma notificação</p>';
            return;
        }
        
        let html = '';
        notifications.forEach(notif => {
            const typeClass = `text-${notif.type}`;
            html += `
                <div class="notification-item">
                    <strong><i class="fas ${notif.icon} ${typeClass}"></i> ${notif.title}</strong>
                    <p>${notif.message}</p>
                    <small>${notif.time}</small>
                </div>
            `;
        });
        
        panel.innerHTML = html;
    },

    // ==================== ESTATÍSTICAS DO HEADER ====================
    updateHeaderStats: function() {
        // Atualizar força atual (simulado)
        const strength = document.getElementById('current-strength');
        if (strength) {
            const workouts = this.getData('workouts');
            if (workouts && workouts.length > 0) {
                // Lógica para calcular força baseada nos últimos treinos
                strength.textContent = '92.5%';
            }
        }
        
        // Atualizar volume semanal (simulado)
        const volume = document.getElementById('weekly-volume');
        if (volume) {
            volume.textContent = '48.2t';
        }
        
        // Atualizar recuperação (simulado)
        const recovery = document.getElementById('recovery-score');
        if (recovery) {
            const recoveryData = this.getData('recovery');
            if (recoveryData && recoveryData.length > 0) {
                const latest = recoveryData[recoveryData.length - 1];
                recovery.textContent = latest.score ? `${latest.score}%` : '86%';
            }
        }
        
        // Atualizar próximo ciclo (simulado)
        const nextCycle = document.getElementById('next-cycle');
        if (nextCycle) {
            nextCycle.textContent = '14';
        }
    },

    // ==================== EVENT LISTENERS ====================
    setupEventListeners: function() {
        // Navegação na sidebar
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const module = link.getAttribute('data-module');
                if (module) {
                    this.loadModule(module);
                }
            });
        });
        
        // Notificações
        const notifToggle = document.getElementById('notification-toggle');
        if (notifToggle) {
            notifToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNotificationPanel();
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
        
        // Sair
        const userLogout = document.getElementById('user-logout');
        if (userLogout) {
            userLogout.addEventListener('click', () => {
                if (confirm('Deseja realmente sair?')) {
                    // Implementar logout
                    alert('Logout realizado');
                    this.toggleUserModal();
                }
            });
        }
        
        // Overlay (fechar modais)
        if (this.dom.overlay) {
            this.dom.overlay.addEventListener('click', () => {
                this.closeAllModals();
            });
        }
        
        // Configurações - salvar
        const saveSettings = document.getElementById('save-settings');
        if (saveSettings) {
            saveSettings.addEventListener('click', () => {
                this.saveCurrentSettings();
            });
        }
        
        // Configurações - cancelar
        const cancelSettings = document.getElementById('cancel-settings');
        if (cancelSettings) {
            cancelSettings.addEventListener('click', () => {
                this.closeSettingsModal();
            });
        }
        
        // Exportar dados
        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportAllData();
            });
        }
        
        // Importar dados
        const importBtn = document.getElementById('import-data');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.importData();
            });
        }
        
        // Resetar dados
        const resetBtn = document.getElementById('reset-data');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('ATENÇÃO: Isso apagará TODOS os seus dados. Tem certeza?')) {
                    if (confirm('CONFIRMAÇÃO FINAL: Todos os dados serão perdidos.')) {
                        this.resetAllData();
                    }
                }
            });
        }
        
        // Fechar modais com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    },

    // ==================== MODAIS ====================
    toggleNotificationPanel: function() {
        const panel = this.dom.notificationPanel;
        if (panel.style.display === 'block') {
            panel.style.display = 'none';
            this.dom.overlay.style.display = 'none';
        } else {
            panel.style.display = 'block';
            this.dom.overlay.style.display = 'block';
            this.closeUserModal();
            this.closeSettingsModal();
        }
    },

    toggleUserModal: function() {
        const modal = this.dom.userModal;
        if (modal.style.display === 'block') {
            modal.style.display = 'none';
            this.dom.overlay.style.display = 'none';
        } else {
            modal.style.display = 'block';
            this.dom.overlay.style.display = 'block';
            this.closeNotificationPanel();
            this.closeSettingsModal();
            
            // Atualizar dados do usuário no modal
            this.updateUserModal();
        }
    },

    updateUserModal: function() {
        if (!this.state.user) return;
        
        const weight = document.getElementById('user-weight');
        const height = document.getElementById('user-height');
        const age = document.getElementById('user-age');
        const experience = document.getElementById('user-experience');
        
        if (weight) weight.textContent = `${this.state.user.weight}kg`;
        if (height) height.textContent = `${this.state.user.height}cm`;
        if (age) age.textContent = `${this.state.user.age} anos`;
        if (experience) experience.textContent = `${this.state.user.experience} anos`;
    },

    showSettingsModal: function() {
        const modal = this.dom.settingsModal;
        modal.style.display = 'block';
        this.dom.overlay.style.display = 'block';
        this.closeNotificationPanel();
        this.closeUserModal();
        
        // Preencher configurações atuais
        this.populateSettingsForm();
    },

    populateSettingsForm: function() {
        const themeSelect = document.getElementById('theme-select');
        const unitSelect = document.getElementById('unit-select');
        const notifEnabled = document.getElementById('notifications-enabled');
        const autoSaveEnabled = document.getElementById('auto-save-enabled');
        const offlineMode = document.getElementById('offline-mode');
        
        if (themeSelect) themeSelect.value = this.state.settings.theme;
        if (unitSelect) unitSelect.value = this.state.settings.units;
        if (notifEnabled) notifEnabled.checked = this.state.settings.notifications;
        if (autoSaveEnabled) autoSaveEnabled.checked = this.state.settings.autoSave;
        if (offlineMode) offlineMode.checked = this.state.settings.offlineMode;
    },

    saveCurrentSettings: function() {
        const themeSelect = document.getElementById('theme-select');
        const unitSelect = document.getElementById('unit-select');
        const notifEnabled = document.getElementById('notifications-enabled');
        const autoSaveEnabled = document.getElementById('auto-save-enabled');
        const offlineMode = document.getElementById('offline-mode');
        
        this.state.settings.theme = themeSelect ? themeSelect.value : 'dark';
        this.state.settings.units = unitSelect ? unitSelect.value : 'metric';
        this.state.settings.notifications = notifEnabled ? notifEnabled.checked : true;
        this.state.settings.autoSave = autoSaveEnabled ? autoSaveEnabled.checked : true;
        this.state.settings.offlineMode = offlineMode ? offlineMode.checked : false;
        
        this.saveSettings();
        this.closeSettingsModal();
        
        alert('Configurações salvas com sucesso!');
    },

    closeSettingsModal: function() {
        if (this.dom.settingsModal) {
            this.dom.settingsModal.style.display = 'none';
        }
        this.dom.overlay.style.display = 'none';
    },

    closeNotificationPanel: function() {
        if (this.dom.notificationPanel) {
            this.dom.notificationPanel.style.display = 'none';
        }
    },

    closeUserModal: function() {
        if (this.dom.userModal) {
            this.dom.userModal.style.display = 'none';
        }
    },

    closeAllModals: function() {
        this.closeNotificationPanel();
        this.closeUserModal();
        this.closeSettingsModal();
        this.dom.overlay.style.display = 'none';
    },

    // ==================== EXPORTAÇÃO/IMPORTAÇÃO ====================
    exportAllData: function() {
        const exportData = {
            meta: {
                app: this.config.appName,
                version: this.config.version,
                exportDate: new Date().toISOString(),
                dataVersion: '1.0'
            },
            user: this.state.user,
            settings: this.state.settings,
            data: this.state.data
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = `athlete-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        alert('Dados exportados com sucesso!');
    },

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
                    
                    // Validar estrutura do arquivo
                    if (!data.meta || data.meta.app !== this.config.appName) {
                        alert('Arquivo de backup inválido!');
                        return;
                    }
                    
                    if (confirm('Deseja importar todos os dados? Isso substituirá os dados atuais.')) {
                        // Importar dados
                        if (data.user) this.state.user = data.user;
                        if (data.settings) this.state.settings = data.settings;
                        if (data.data) this.state.data = data.data;
                        
                        // Salvar no localStorage
                        this.saveUserData();
                        this.saveSettings();
                        Object.keys(this.state.data).forEach(key => {
                            this.saveData(key, this.state.data[key]);
                        });
                        
                        alert('Dados importados com sucesso! A página será recarregada.');
                        setTimeout(() => location.reload(), 1000);
                    }
                } catch (error) {
                    alert('Erro ao ler o arquivo: ' + error.message);
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    },

    resetAllData: function() {
        // Limpar localStorage
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.config.localStoragePrefix)) {
                localStorage.removeItem(key);
            }
        });
        
        // Resetar estado
        this.state.user = this.getDefaultUser();
        this.state.settings = {
            theme: 'dark',
            units: 'metric',
            notifications: true,
            autoSave: true,
            offlineMode: false
        };
        Object.keys(this.state.data).forEach(key => {
            this.state.data[key] = [];
        });
        
        // Salvar defaults
        this.saveUserData();
        this.saveSettings();
        
        alert('Todos os dados foram resetados. A página será recarregada.');
        setTimeout(() => location.reload(), 1000);
    },

    // ==================== UTILITÁRIOS ====================
    formatDate: function(date, format = 'pt-BR') {
        if (!date) return '';
        
        const d = new Date(date);
        if (format === 'pt-BR') {
            return d.toLocaleDateString('pt-BR');
        } else if (format === 'iso') {
            return d.toISOString().split('T')[0];
        } else {
            return d.toLocaleDateString();
        }
    },

    formatNumber: function(number, decimals = 2) {
        if (isNaN(number)) return '0';
        return parseFloat(number).toFixed(decimals);
    },

    calculate1RM: function(weight, reps, formula = 'epley') {
        if (!weight || !reps || weight <= 0 || reps <= 0) return 0;
        
        switch(formula) {
            case 'epley':
                return weight * (1 + (reps / 30));
            case 'brzycki':
                return weight * (36 / (37 - reps));
            case 'lander':
                return (100 * weight) / (101.3 - 2.67123 * reps);
            case 'wathan':
                return (100 * weight) / (48.8 + 53.8 * Math.exp(-0.075 * reps));
            case 'lombardi':
                return weight * Math.pow(reps, 0.1);
            default:
                return weight * (1 + (reps / 30));
        }
    },

    calculateWilks: function(bodyweight, total, gender = 'male') {
        if (!bodyweight || !total || bodyweight <= 0 || total <= 0) return 0;
        
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
        
        return wilks;
    },

    // ==================== DEPURAÇÃO ====================
    log: function(message, data = null) {
        if (this.config.debug) {
            console.log(`[${this.config.appName}] ${message}`, data);
        }
    },

    error: function(message, error = null) {
        console.error(`[${this.config.appName} ERROR] ${message}`, error);
    }
};

// ==================== INICIALIZAÇÃO GLOBAL ====================
// Tornar AthletePro global para acesso nos módulos
window.AthletePro = AthletePro;

// Objeto global para módulos se registrarem
window.AthleteProModules = {};

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AthletePro.init());
} else {
    AthletePro.init();
}

// ==================== FIM DO ARQUIVO PRINCIPAL ====================
