import { auth, db } from './firebase-init.js';
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { renderizarPainelAdmin } from './admin.js';

let temporizadorInatividade = null;
const TEMPO_LIMITE = 5 * 60 * 1000; // 5 minutos em milissegundos

function reiniciarContadorInatividade() {
    clearTimeout(temporizadorInatividade);
    
    temporizadorInatividade = setTimeout(() => {
        // Se passar o tempo sem atividade, faz logout automático
        signOut(auth).then(() => {
            alert("Sessão encerrada por inatividade (5 minutos sem uso).");
        }).catch((error) => {
            console.error("Erro ao encerrar sessão:", error);
        });
    }, TEMPO_LIMITE);
}

function iniciarMonitoramentoInatividade() {
    // Eventos que indicam que o usuário está mexendo no sistema
    const eventos = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    eventos.forEach(evento => {
        window.addEventListener(evento, reiniciarContadorInatividade);
    });
    
    // Inicia a contagem pela primeira vez
    reiniciarContadorInatividade();
}

function pararMonitoramentoInatividade() {
    const eventos = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    eventos.forEach(evento => {
        window.removeEventListener(evento, reiniciarContadorInatividade);
    });
    clearTimeout(temporizadorInatividade);
}

export async function verificarLoginEExibirTela(user) {
    const appDiv = document.getElementById('app');
    
    try {
        const userDocRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userDocRef);

        let perfil = "entregador"; 
        if (userSnap.exists()) {
            perfil = userSnap.data().perfil; 
        }

        appDiv.innerHTML = `
            <div class="p-6 max-w-4xl mx-auto">
                <div class="bg-white p-6 rounded-xl shadow-sm border flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-xl font-bold text-slate-800">Sistema de Ovos</h2>
                        <p class="text-sm text-slate-500">${user.email} <span class="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded uppercase font-semibold">${perfil}</span></p>
                    </div>
                    <button id="btn-sair" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-all">Sair</button>
                </div>
                <div id="painel-conteudo" class="bg-white p-6 rounded-xl shadow-sm border">
                    <p class="text-slate-600">Carregando painel...</p>
                </div>
            </div>
        `;

        document.getElementById('btn-sair').addEventListener('click', () => {
            pararMonitoramentoInatividade();
            signOut(auth);
        });

        // Ativa o monitor de 5 minutos de inatividade
        iniciarMonitoramentoInatividade();

        carregarModuloPorPerfil(perfil, user.email);

    } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        appDiv.innerHTML = `<div class="p-6 text-red-500">Erro ao carregar permissões do usuário.</div>`;
    }
}

export function exibirTelaLogin() {
    // Garante que o monitor de inatividade está desligado na tela de login
    pararMonitoramentoInatividade();

    const appDiv = document.getElementById('app');
    appDiv.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-slate-100 px-4">
            <div class="bg-white p-8 rounded-2xl shadow-md border w-full max-w-md">
                <h1 class="text-2xl font-bold text-slate-800 mb-2 text-center">🥚 Sistema de Ovos</h1>
                <p class="text-sm text-slate-500 mb-6 text-center">Faça login para acessar o painel</p>
                
                <form id="form-login" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                        <input type="email" id="login-email" required class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                        <input type="password" id="login-senha" required class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none">
                    </div>
                    <button type="submit" class="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg transition-all">Entrar</button>
                </form>
                <div id="login-erro" class="mt-4 text-sm text-red-500 text-center hidden"></div>
            </div>
        </div>
    `;

    document.getElementById('form-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const senha = document.getElementById('login-senha').value;
        const erroDiv = document.getElementById('login-erro');

        try {
            erroDiv.classList.add('hidden');
            await signInWithEmailAndPassword(auth, email, senha);
        } catch (error) {
            erroDiv.textContent = "Erro ao entrar: " + error.message;
            erroDiv.classList.remove('hidden');
        }
    });
}

import { renderizarPainelEntregador } from './entregador.js';

function carregarModuloPorPerfil(perfil, email) {
    const conteudo = document.getElementById('painel-conteudo');
    if (perfil === 'admin') {
        renderizarPainelAdmin(conteudo, email);
    } else if (perfil === 'financeiro') {
        conteudo.innerHTML = `<h3 class="font-semibold text-lg text-emerald-600 mb-2">Painel Financeiro</h3><p>Módulo financeiro em desenvolvimento.</p>`;
    } else {
        renderizarPainelEntregador(conteudo, email);
    }
}
