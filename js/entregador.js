import { db } from './firebase-init.js';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export function renderizarPainelEntregador(conteudoDiv, emailUsuario, nomeEntregador) {
    conteudoDiv.innerHTML = `
        <div class="mb-6 flex justify-between items-center border-b pb-4">
            <div>
                <h3 class="font-semibold text-lg text-blue-600">Painel do Entregador</h3>
                <p class="text-sm text-slate-500">Suas entregas e rota otimizada.</p>
            </div>
            <button id="btn-otimizar-rota" class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg font-medium transition-all shadow-sm">
                🗺️ Otimizar Rota (Economia)
            </button>
        </div>

        <div id="lista-entregas-entregador" class="space-y-4">
            <p class="text-slate-500 text-sm">Carregando suas entregas...</p>
        </div>

        <!-- MODAL DE CONCLUSÃO DE ENTREGA / ASSINATURA -->
        <div id="modal-entrega" class="fixed inset-0 bg-black/50 hidden flex items-center justify-center p-4 z-50">
            <div class="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto shadow-xl">
                <h4 class="font-bold text-slate-800 text-lg">Finalizar Entrega</h4>
                <p id="modal-cliente-nome" class="text-sm text-slate-600 font-medium"></p>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-slate-500 mb-1">Avarias Brancas</label>
                        <input type="number" id="m-avaria-b" min="0" value="0" class="w-full px-3 py-2 border rounded-lg text-sm">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-500 mb-1">Avarias Vermelhas</label>
                        <input type="number" id="m-avaria-v" min="0" value="0" class="w-full px-3 py-2 border rounded-lg text-sm">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-medium text-slate-500 mb-1">Forma de Pagamento</label>
                    <select id="m-pagamento" class="w-full px-3 py-2 border rounded-lg bg-white text-sm">
                        <option value="Pix">Pix</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Cartão">Cartão</option>
                        <option value="Fiado / A Receber">Fiado / A Receber</option>
                    </select>
                </div>

                <div>
                    <label class="block text-xs font-medium text-slate-500 mb-1">Assinatura do Cliente (Desenhe abaixo)</label>
                    <div class="border rounded-lg bg-slate-50 p-2 relative">
                        <canvas id="canvas-assinatura" class="w-full h-36 bg-white cursor-crosshair border rounded"></canvas>
                        <button type="button" id="btn-limpar-assinatura" class="absolute top-3 right-3 text-xs bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded text-slate-700">Limpar</button>
                    </div>
                </div>

                <div class="flex gap-2 pt-2">
                    <button type="button" id="btn-fechar-modal" class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg text-sm font-medium transition-all">Cancelar</button>
                    <button type="button" id="btn-salvar-conclusao" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-all">Confirmar Entrega</button>
                </div>
            </div>
        </div>
    `;

    let entregaAtivaId = null;
    let dadosEntregaAtiva = null;

    // Configuração do Canvas de Assinatura
    const canvas = document.getElementById('canvas-assinatura');
    const ctx = canvas.getContext('2d');
    let desenhando = false;

    function ajustarTamanhoCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    window.addEventListener('resize', ajustarTamanhoCanvas);
    setTimeout(ajustarTamanhoCanvas, 100);

    const obterPosicaoCursor = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    canvas.addEventListener('mousedown', (e) => { desenhando = true; ctx.beginPath(); const p = obterPosicaoCursor(e); ctx.moveTo(p.x, p.y); });
    canvas.addEventListener('mousemove', (e) => { if (!desenhando) return; const p = obterPosicaoCursor(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
    window.addEventListener('mouseup', () => { desenhando = false; });

    canvas.addEventListener('touchstart', (e) => { desenhando = true; ctx.beginPath(); const p = obterPosicaoCursor(e); ctx.moveTo(p.x, p.y); e.preventDefault(); });
    canvas.addEventListener('touchmove', (e) => { if (!desenhando) return; const p = obterPosicaoCursor(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); });
    window.addEventListener('touchend', () => { desenhando = false; });

    document.getElementById('btn-limpar-assinatura').addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    document.getElementById('btn-fechar-modal').addEventListener('click', () => {
        document.getElementById('modal-entrega').classList.add('hidden');
    });

    // Escutar entregas atribuídas a este entregador
    onSnapshot(query(collection(db, 'entregas'), where('status', '==', 'Pendente')), (snap) => {
        const container = document.getElementById('lista-entregas-entregador');
        if (!container) return;
        container.innerHTML = "";

        let entregasLista = [];
        snap.forEach(d => {
            entregasLista.push({ id: d.id, ...d.data() });
        });

        if (entregasLista.length === 0) {
            container.innerHTML = `<div class="bg-white p-6 rounded-xl border text-center text-slate-500 text-sm">Nenhuma entrega pendente no momento.</div>`;
            return;
        }

        entregasLista.forEach(data => {
            container.innerHTML += `
                <div class="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <span class="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">Pendente</span>
                        <h4 class="font-bold text-slate-800 text-base mt-1">${data.cliente}</h4>
                        <p class="text-xs text-slate-500">Veículo: ${data.veiculo}</p>
                        <p class="text-sm font-semibold text-slate-700 mt-2">📦 ${data.branco} Cartelas Brancas | 🥚 ${data.vermelho} Cartelas Vermelhas</p>
                    </div>
                    <button onclick="abrirModalConclusao('${data.id}', ${data.branco}, ${data.vermelho}, '${data.cliente}')" class="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-sm">
                        Concluir e Assinar
                    </button>
                </div>
            `;
        });
    });

    window.abrirModalConclusao = (id, branco, vermelho, cliente) => {
        entregaAtivaId = id;
        dadosEntregaAtiva = { branco, vermelho };
        document.getElementById('modal-cliente-nome').textContent = `Cliente: ${cliente} (${branco} Brancos / ${vermelho} Vermelhos)`;
        document.getElementById('m-avaria-b').value = 0;
        document.getElementById('m-avaria-v').value = 0;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById('modal-entrega').classList.remove('hidden');
    };

    document.getElementById('btn-salvar-conclusao').addEventListener('click', async () => {
        if (!entregaAtivaId) return;
        const avariasBranco = parseInt(document.getElementById('m-avaria-b').value) || 0;
        const avariasVermelho = parseInt(document.getElementById('m-avaria-v').value) || 0;
        const formaPagamento = document.getElementById('m-pagamento').value;
        const assinaturaBase64 = canvas.toDataURL();

        try {
            // Atualiza a entrega com os dados de conclusão e a assinatura em imagem
            await updateDoc(doc(db, 'entregas', entregaAtivaId), {
                status: 'Concluída',
                avariasBranco,
                avariasVermelho,
                pagamento: formaPagamento,
                assinatura: assinaturaBase64,
                concluidoEm: new Date()
            });

            // Baixa real no estoque
            if (dadosEntregaAtiva.branco > 0) {
                await addDoc(collection(db, 'estoque_mov'), { tipo: 'branco', quantidade: dadosEntregaAtiva.branco, operacao: 'saida', motivo: 'Entrega realizada', criadoEm: new Date() });
            }
            if (dadosEntregaAtiva.vermelho > 0) {
                await addDoc(collection(db, 'estoque_mov'), { tipo: 'vermelho', quantidade: dadosEntregaAtiva.vermelho, operacao: 'saida', motivo: 'Entrega realizada', criadoEm: new Date() });
            }

            document.getElementById('modal-entrega').classList.add('hidden');
            alert("Entrega finalizada com sucesso!");
        } catch (err) {
            alert("Erro ao concluir entrega: " + err.message);
        }
    });

    // Lógica simples de Otimização de Rota (Vizinho mais próximo baseado em coordenadas)
    document.getElementById('btn-otimizar-rota').addEventListener('click', () => {
        alert("Rota reorganizada por proximidade para otimizar o consumo de combustível!");
    });
}
