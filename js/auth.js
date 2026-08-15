import { auth, db } from './firebase-init.js';
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Função que o app.js está procurando
export async function verificarLoginEExibirTela(user) {
    const appDiv = document.getElementById('app');
    
    try {
        // Busca o cargo/perfil do usuário no Firestore (coleção 'usuarios')
        const userDocRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userDocRef);

        let perfil = "entregador"; // Padrão caso não ache
        if (userSnap.exists()) {
            perfil = userSnap.data().perfil; // 'admin', 'financeiro' ou 'entregador'
        }

        // Renderiza o painel baseado no nível de acesso
        appDiv.innerHTML = `
            <div class="p-6 max-w-4xl mx-auto">
                <div class="bg-white p-6 rounded-xl shadow-sm border flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-xl font-bold text-slate-800">Painel Principal</h2>
                        <p class="text-sm text-slate-500">Logado como: ${user.email} <span class="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded uppercase font-semibold">${perfil}</span></p>
                    </div>
                    <button id="btn-sair" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-all">Sair</button>
                </div>
                <div id="painel-conteudo" class="bg-white p-6 rounded-xl shadow-sm border">
                    <p class="text-slate-600">Carregando módulos do perfil <b>${perfil}</b>...</p>
                </div>
            </div>
        `;

        // Ação do botão de logout
        document.getElementById('btn-sair').addEventListener('click', () => {
            signOut(auth);
        });

        // Aqui depois vamos chamar os módulos específicos (admin, financeiro, entregador)
        carregarModuloPorPerfil(perfil);

    } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        appDiv.innerHTML = `<div class="p-6 text-red-500">Erro ao carregar permissões do usuário.</div>`;
    }
}

// 2. Função para desenhar a Tela de Login caso o usuário não esteja autenticado
export function exibirTelaLogin() {
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

function carregarModuloPorPerfil(perfil) {
    const conteudo = document.getElementById('painel-conteudo');
    if (perfil === 'admin') {
        conteudo.innerHTML = `<h3 class="font-semibold text-lg text-amber-600 mb-2">Painel Administrativo</h3><p>Aqui ficarão os cadastros de Clientes, Entregadores, Veículos e o Mapa Geral.</p>`;
    } else if (perfil === 'financeiro') {
        conteudo.innerHTML = `<h3 class="font-semibold text-lg text-emerald-600 mb-2">Painel Financeiro</h3><p>Aqui ficarão os relatórios de faturamento, caixas e pagamentos.</p>`;
    } else {
        conteudo.innerHTML = `<h3 class="font-semibold text-lg text-blue-600 mb-2">Painel do Entregador</h3><p>Aqui ficarão apenas as suas entregas atribuídas e rota de entrega.</p>`;
    }
}
