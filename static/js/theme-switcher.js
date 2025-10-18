// static/js/theme-switcher.js - VERSÃO SIMPLES
class ThemeSwitcher {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.mainCss = document.getElementById('main-css');
        this.currentTheme = this.getStoredTheme();
        
        // Caminhos fixos - ajuste conforme sua estrutura
        this.cssPaths = {
            dark: '/static/css/style_frutas3.css',
            light: '/static/css/style_frutas2_light.css'
        };
        
        this.init();
    }
    
    init() {
        this.applyTheme(this.currentTheme);
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }
    
    getStoredTheme() {
        return localStorage.getItem('theme') || 'dark';
    }
    
    applyTheme(theme) {
        this.mainCss.href = this.cssPaths[theme];
        this.updateButton(theme);
        localStorage.setItem('theme', theme);
        this.updateCharts(theme);
    }
    
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(this.currentTheme);
    }
    
    updateButton(theme) {
        const icon = this.themeToggle.querySelector('i');
        const text = this.themeToggle.querySelector('span');
        
        if (theme === 'light') {
            icon.className = 'fas fa-sun';
            text.textContent = 'Tema Claro';
        } else {
            icon.className = 'fas fa-moon';
            text.textContent = 'Tema Escuro';
        }
    }
    
    updateCharts(theme) {
        if (typeof Chart !== 'undefined' && Chart.instances) {
            Object.values(Chart.instances).forEach(chart => chart.update());
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ThemeSwitcher();
});