import { db } from './firebase-init.js';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export function renderizarPainelEntregador(conteudoDiv, emailUsuario, nomeEntregador) {
    conteudoDiv.innerHTML = `
        <div class="mb-6 flex justify-between items-center border-b pb-4">
            <div>
                <h3 class="font-semibold text-lg text-blue-600">Painel do Entregador</h3>
                <p class="text-sm text-slate-500">Rastreamento ativo e entregas pendentes.</p>
            </div>
            <button id="btn-otimizar-rota" class="bg-blue-600 text-white text-xs px-3 py-2 rounded-lg font-medium shadow-sm">🗺️ Otimizar Rota</button>
        </div>
        <div id="lista-entregas-entregador" class="space-y-4"><p class="text-slate-500 text-sm">Carregando...</p></div>

        <!-- MODAL -->
        <div id="modal-entrega" class="fixed inset-0 bg-black/50 hidden flex items-center justify-center p-4 z-50">
            <div class="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-xl">
                <h4 class="font-bold text-lg">Finalizar Entrega</h4>
                <p id="modal-cliente-nome" class="text-sm text-slate-600"></p>
                <div class="grid grid-cols-2 gap-3">
                    <input type="number" id="m-avaria-b" placeholder="Avarias Brancas" class="w-full px-3 py-2 border rounded-lg text-sm">
                    <input type="number" id="m-avaria-v" placeholder="Avarias Vermelhas" class="w-full px-3 py-2 border rounded-lg text-sm">
                </div>
                <select id="m-pagamento" class="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="Pix">Pix</option><option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão">Cartão</option><option value="Fiado / A Receber">Fiado / A Receber</option>
                </select>
                <div class="border rounded-lg p-2 relative">
                    <canvas id="canvas-assinatura" class="w-full h-32 bg-slate-50 cursor-crosshair"></canvas>
                    <button type="button" id="btn-limpar-assinatura" class="absolute top-2 right-2 text-xs bg-slate-200 px-2 py-1 rounded">Limpar</button>
                </div>
                <div class="flex gap-2">
                    <button id="btn-fechar-modal" class="flex-1 bg-slate-200 py-2 rounded-lg text-sm">Cancelar</button>
                    <button id="btn-salvar-conclusao" class="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-bold">Confirmar Entrega</button>
                </div>
            </div>
        </div>
    `;

    // --- Rastreamento ---
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(async (pos) => {
            await setDoc(doc(db, 'entregadores_posicao', emailUsuario), {
                lat: pos.coords.latitude, lng: pos.coords.longitude,
                nome: nomeEntregador, ultimaAtualizacao: new Date()
            }, { merge: true });
        }, null, { enableHighAccuracy: true });
    }

    // --- Lógica de Assinatura ---
    const canvas = document.getElementById('canvas-assinatura');
    const ctx = canvas.getContext('2d');
    let desenhando = false;
    
    // Ajuste responsivo do canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;

    const getPos = (e) => {
        const r = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - r.left, y: clientY - r.top };
    };

    canvas.onmousedown = (e) => { desenhando = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); };
    canvas.onmousemove = (e) => { if(desenhando) { const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); } };
    window.onmouseup = () => desenhando = false;
    document.getElementById('btn-limpar-assinatura').onclick = () => ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- Gerenciamento de Entregas ---
    let entregaAtiva = {};

    onSnapshot(query(collection(db, 'entregas'), where('status', '==', 'Pendente')), (snap) => {
        const container = document.getElementById('lista-entregas-entregador');
        container.innerHTML = snap.empty ? `<p class="text-slate-500">Nenhuma entrega.</p>` : "";
        snap.forEach(d => {
            const data = d.data();
            const div = document.createElement('div');
            div.className = "bg-white p-4 rounded-xl border flex justify-between items-center";
            div.innerHTML = `<div><h4 class="font-bold">${data.cliente}</h4><p class="text-xs">📦 ${data.branco}B | ${data.vermelho}V</p></div>`;
            const btn = document.createElement('button');
            btn.className = "bg-green-600 text-white px-4 py-2 rounded-lg text-sm";
            btn.textContent = "Concluir";
            btn.onclick = () => {
                entregaAtiva = { id: d.id, ...data };
                document.getElementById('modal-cliente-nome').textContent = `Cliente: ${data.cliente}`;
                document.getElementById('modal-entrega').classList.remove('hidden');
            };
            div.appendChild(btn);
            container.appendChild(div);
        });
    });

    document.getElementById('btn-fechar-modal').onclick = () => document.getElementById('modal-entrega').classList.add('hidden');

    document.getElementById('btn-salvar-conclusao').onclick = async () => {
        const btn = document.getElementById('btn-salvar-conclusao');
        btn.textContent = "Salvando..."; btn.disabled = true;

        try {
            await updateDoc(doc(db, 'entregas', entregaAtiva.id), {
                status: 'Concluída',
                avariasBranco: parseInt(document.getElementById('m-avaria-b').value) || 0,
                avariasVermelho: parseInt(document.getElementById('m-avaria-v').value) || 0,
                pagamento: document.getElementById('m-pagamento').value,
                assinatura: canvas.toDataURL(),
                concluidoEm: new Date()
            });

            // Dar baixa no estoque
            await addDoc(collection(db, 'estoque_mov'), { tipo: 'branco', quantidade: entregaAtiva.branco, operacao: 'saida', criadoEm: new Date() });
            await addDoc(collection(db, 'estoque_mov'), { tipo: 'vermelho', quantidade: entregaAtiva.vermelho, operacao: 'saida', criadoEm: new Date() });

            document.getElementById('modal-entrega').classList.add('hidden');
            alert("Entrega finalizada com sucesso!");
        } catch (e) { alert("Erro ao salvar: " + e.message); }
        btn.textContent = "Confirmar Entrega"; btn.disabled = false;
    };
}
