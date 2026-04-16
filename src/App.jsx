import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  onSnapshot
} from 'firebase/firestore';
import {
  ShieldCheck,
  Ghost,
  Share2,
  ChevronLeft,
  Instagram,
  Loader2,
  Copy,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  ArrowRight,
  XCircle,
  Globe,
  Send,
  Inbox,
  Clock,
  Download,
  Image as ImageIcon,
  User,
  Eye,
  Coins,
  Ticket
} from 'lucide-react';

/**
 * PROJETO OFFIN - VERSÃO DE PRODUÇÃO V10 (TOKEN ECONOMY)
 * Foco: Sistema de Moedas, Referrals (Indicações) e Paywall Autêntico
 */

const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyCxDn2wieUqdUFtFUDVJyIlWVN2Kg8WdQ0",
      authDomain: "offinn-89849.firebaseapp.com",
      projectId: "offinn-89849",
      storageBucket: "offinn-89849.firebasestorage.app",
      messagingSenderId: "580679008063",
      appId: "1:580679008063:web:9fce23acaafd6699c4dd8a"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = typeof __app_id !== 'undefined' ? __app_id : "offinn-89849"; 

const isInstagramBrowser = () => {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return (ua.indexOf('Instagram') > -1) || (ua.indexOf('FBAN') > -1) || (ua.indexOf('FBAV') > -1);
};

const getCurrentAppUrl = () => {
  const origin = window.location.origin;
  const path = window.location.pathname;
  if (path.includes('app.html') || path === '/app') return origin + path;
  return origin + '/app.html';
};

const APP_URL = getCurrentAppUrl();

const copyToClipboardFallback = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Falha ao copiar link:', err);
  }
  document.body.removeChild(textArea);
};

// --- GERADOR DE IMAGEM PARA STORIES ---
const downloadStoryImage = (handle) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('https://off-in.vercel.app/', 540, 120);

  ctx.shadowColor = 'rgba(6, 182, 212, 0.8)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 900 220px sans-serif';
  ctx.fillText('OFF', 460, 480);
  
  ctx.shadowColor = 'rgba(236, 72, 153, 0.8)';
  ctx.fillStyle = '#ec4899';
  ctx.font = 'italic 900 220px sans-serif';
  ctx.fillText('IN', 720, 480);
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  if (ctx.roundRect) ctx.roundRect(120, 750, 840, 400, 80); else ctx.rect(120, 750, 840, 400);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 65px sans-serif';
  ctx.fillText('ME MANDE UM SEGREDO', 540, 930);
  ctx.font = '400 50px sans-serif';
  ctx.fillText('EU VOU REVELAR QUEM É! 👀', 540, 1030);

  ctx.fillStyle = '#06b6d4';
  ctx.font = '900 120px sans-serif';
  ctx.fillText('LINK', 540, 1420);
  ctx.font = 'bold 35px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText('👇 COLE O ADESIVO AQUI 👇', 540, 1500);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 42px sans-serif';
  ctx.fillText('Até que ponto a curiosidade pode chegar?', 540, 1750);
  ctx.fillStyle = '#06b6d4';
  ctx.font = 'bold 48px sans-serif';
  ctx.fillText('Descubra você também!', 540, 1830);

  const link = document.createElement('a');
  link.download = `offin-desafio.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

const Toast = ({ message, type = 'error', onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 duration-300 w-[90%] max-w-xs">
      <div className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col gap-2 border ${
        type === 'error' ? 'bg-red-500 border-red-400 text-white' : 'bg-cyan-500 border-cyan-400 text-white'
      }`}>
        <div className="flex items-center gap-3">
          {type === 'error' ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
          <p className="text-xs font-bold flex-1">{message}</p>
          <button onClick={onClose} className="opacity-50"><XCircle size={16} /></button>
        </div>
      </div>
    </div>
  );
};

const BrowserWarning = () => {
  if (!isInstagramBrowser()) return null;
  return (
    <div className="bg-red-600 text-white p-4 text-xs font-black text-center flex flex-col items-center gap-2 border-b-4 border-red-800 animate-pulse">
      <div className="flex items-center gap-2 uppercase tracking-tighter">
        <AlertCircle size={18} />
        O Instagram bloqueia o Login!
      </div>
      <p className="font-medium opacity-90 leading-tight">Clique nos "..." no topo e selecione "Abrir no Navegador" (Chrome/Safari) para conseguir usar o OFFin.</p>
    </div>
  );
};

const Button = ({ children, onClick, variant = 'primary', icon: Icon, disabled, loading, className = '' }) => {
  const base = 'w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50';
  const variants = {
    primary: 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20',
    secondary: 'bg-slate-800 text-slate-300 border border-slate-700',
    ghost: 'bg-transparent text-slate-400 font-medium text-sm',
    success: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20',
    warning: 'bg-yellow-500 text-yellow-950 shadow-lg shadow-yellow-500/20',
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} className={`${base} ${variants[variant]} ${className}`}>
      {loading ? <Loader2 className="animate-spin" size={20} /> : (
        <>
          {children}
          {Icon && <Icon size={20} />}
        </>
      )}
    </button>
  );
};

// --- TELAS ---

const CreateLinkScreen = ({ user, referrerUid, onNext, setToast }) => {
  const [handle, setHandle] = useState('@');
  const [loading, setLoading] = useState(false);

  const handleCreateProfile = async () => {
    if (!handle.trim() || handle === '@' || !user) return;
    setLoading(true);
    try {
      const cleanHandle = handle.trim().replace('@', '');
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
      const userSnap = await getDoc(userRef);

      // Se for a primeira vez criando o perfil
      if (!userSnap.exists()) {
        await setDoc(userRef, { 
          uid: user.uid, 
          handle: cleanHandle, 
          createdAt: new Date().toISOString(),
          isPermanent: !user.isAnonymous,
          tokens: 1 // Dá 1 moeda de boas-vindas
        });

        // SISTEMA DE REFERRAL (AFILIADO)
        // Se este usuário chegou através do link de alguém (referrerUid), damos 1 moeda ao padrinho!
        if (referrerUid && referrerUid !== user.uid) {
          const refRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', referrerUid);
          const refSnap = await getDoc(refRef);
          if (refSnap.exists()) {
            await updateDoc(refRef, {
              tokens: (refSnap.data().tokens || 0) + 1
            });
          }
        }
      } else {
        // Apenas atualiza
        await updateDoc(userRef, { handle: cleanHandle, isPermanent: !user.isAnonymous });
      }

      onNext(2); 
    } catch (err) { setToast("Erro ao salvar perfil."); } finally { setLoading(false); }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-[#18181b] overflow-y-auto">
      <BrowserWarning />
      <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[50%] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative z-10 flex flex-col min-h-screen p-8 animate-in fade-in duration-500">
        <header className="pt-10 pb-6 flex justify-center flex-col items-center">
           <div className="text-7xl font-black text-white italic tracking-tighter">OFF<span className="text-cyan-500">IN</span></div>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Corrente Anônima</p>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center text-center space-y-12 py-10">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold text-white leading-tight italic tracking-tighter">Quem mandou <br /> esse segredo? 👀</h2>
            <p className="text-lg text-slate-400 font-medium px-4">Crie seu link, coloque no Story e descubra as verdades ocultas.</p>
          </div>
          <div className="w-full max-w-xs space-y-4">
            <input 
              type="text" 
              placeholder="@seu_instagram" 
              value={handle} 
              onChange={(e) => setHandle(e.target.value.startsWith('@') ? e.target.value : '@' + e.target.value.replace('@',''))}
              className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl py-5 px-6 text-white font-bold focus:outline-none focus:border-cyan-500 transition-all text-center" 
            />
            <Button onClick={handleCreateProfile} loading={loading} disabled={!handle || handle === '@' || !user}>Gerar Meu Link</Button>
            <Button onClick={() => onNext(4)} variant="ghost">Já tenho link / Ver Meu Radar</Button>
          </div>
        </main>
      </div>
    </div>
  );
};

const LinkReadyScreen = ({ user, onNext }) => {
  const [copied, setCopied] = useState(false);
  const [handle, setHandle] = useState('');
  const shareLink = `${APP_URL}?u=${user?.uid}`;

  useEffect(() => {
    if (user?.uid) {
      getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid)).then(d => {
        if (d.exists()) setHandle(d.data().handle);
      });
    }
  }, [user]);

  const handleCopy = () => {
    copyToClipboardFallback(shareLink);
    setCopied(true);
    setTimeout(() => onNext(4), 2000); 
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#18181b] p-8 animate-in slide-in-from-right overflow-y-auto text-center justify-center items-center">
      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20">
        <CheckCircle2 size={40} />
      </div>
      <h2 className="text-3xl font-black text-white mb-2 italic tracking-tighter uppercase">Link Gerado!</h2>
      <p className="text-slate-400 mb-6 text-sm">Poste no Instagram seguindo os passos abaixo.</p>
      
      <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-2xl mb-8 flex items-center gap-3 w-full max-w-sm">
         <div className="bg-yellow-500 text-yellow-950 p-2 rounded-full"><Coins size={20}/></div>
         <p className="text-xs text-yellow-500 font-bold text-left leading-tight">Você ganhou <span className="text-yellow-400 font-black text-sm">1 Moeda</span> de boas-vindas para revelar seu primeiro segredo!</p>
      </div>

      <div className="space-y-6 w-full max-w-sm">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] space-y-8 shadow-2xl">
          <div className="space-y-3">
            <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Passo 01</span>
            <Button onClick={() => downloadStoryImage(handle)} variant="secondary" icon={Download}>Baixar Foto para o Story</Button>
          </div>
          <div className="h-px bg-slate-800 w-full" />
          <div className="space-y-3">
            <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Passo 02</span>
            <Button onClick={handleCopy} icon={copied ? CheckCircle2 : Copy} variant={copied ? 'success' : 'primary'}>
              {copied ? 'Link Copiado!' : 'Copiar Link Sticker'}
            </Button>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-cyan-950/20 p-4 rounded-2xl border border-cyan-500/10">
          <AlertCircle size={16} className="text-cyan-500 shrink-0 mt-1" />
          <p className="text-[10px] text-slate-400 text-left leading-relaxed">No Instagram, use o adesivo de <b>LINK</b> e cole o endereço por cima da palavra <b>LINK</b> na imagem que você baixou.</p>
        </div>
      </div>
    </div>
  );
};

const SendSecretScreen = ({ targetUid, user, onReset, setToast }) => {
  const [targetHandle, setTargetHandle] = useState('...');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const fetchTarget = async () => {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', targetUid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setTargetHandle(docSnap.data().handle);
    };
    if (targetUid) fetchTarget();
  }, [targetUid]);

  const handleSend = async () => {
    if (!message.trim() || !user) return;
    setLoading(true);

    const performSend = (currentUser) => {
      let finalName = currentUser.displayName;
      if (!finalName && currentUser.email) finalName = currentUser.email.split('@')[0];
      if (!finalName && currentUser.providerData && currentUser.providerData.length > 0) finalName = currentUser.providerData[0].displayName;
      if (!finalName) finalName = "Identidade Oculta";

      const msgId = crypto.randomUUID();
      return setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', msgId), {
        id: msgId, 
        targetUid, 
        senderUid: currentUser.uid,
        senderName: finalName,
        senderPhoto: currentUser.photoURL || '',
        text: message.trim(), 
        createdAt: new Date().toISOString(), 
        isRevealed: false, 
        status: 'sent'
      }).then(() => {
        setSent(true);
        setLoading(false);
      });
    };

    if (user.isAnonymous) {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        await performSend(result.user);
      } catch (error) {
        setLoading(false);
        if (error.code === 'auth/popup-blocked') {
          setToast("O navegador bloqueou a janela de login. Tente clicar de novo ou abra no Chrome.");
        } else {
          setToast("Erro na autenticação. Tente novamente.");
        }
      }
    } else { 
      await performSend(user); 
    }
  };

  if (sent) return (
    <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center p-8 text-center animate-in zoom-in">
      <CheckCircle2 size={64} className="text-emerald-500 mb-6" />
      <h2 className="text-3xl font-black italic mb-4 text-slate-900 tracking-tighter">ENVIADO COM SUCESSO! 🤫</h2>
      <p className="text-slate-500 mb-10 text-sm">@{targetHandle} só vai saber que foi você se gastar as Moedas dele.</p>
      <Button onClick={onReset} icon={Ticket}>Quero Criar Meu Link Também</Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 p-8 overflow-y-auto">
      <BrowserWarning />
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Mandar segredo para <br/> <span className="text-cyan-500">@{targetHandle}</span></h2>
        <div className="w-full max-w-xs space-y-4">
          <div className="relative">
            <textarea 
              placeholder="Escreva algo que você nunca teve coragem de dizer..." 
              value={message} onChange={(e) => setMessage(e.target.value)} 
              maxLength={150} 
              className="w-full h-44 bg-slate-800 border-2 border-slate-700 rounded-[2.5rem] p-8 text-white resize-none focus:outline-none focus:border-pink-500 font-medium text-lg leading-relaxed shadow-inner" 
            />
            <div className="absolute bottom-6 right-8 text-[10px] text-slate-500 font-bold">{message.length}/150</div>
          </div>
          <Button onClick={handleSend} loading={loading} disabled={!message.trim()} icon={Send}>
            {user?.isAnonymous ? 'Identificar e Enviar' : 'Enviar Segredo'}
          </Button>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Sua identidade será revelada apenas se ele gastar moedas.</p>
        </div>
      </div>
    </div>
  );
};

const InboxScreen = ({ user, userProfile, onSelectMessage, onBack, setToast }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');

  useEffect(() => {
    if (!user) return;
    const msgRef = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
    return onSnapshot(msgRef, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Erro no onSnapshot de messages:", error);
      setLoading(false);
    });
  }, [user]);

  const receivedMsgs = messages.filter(m => m.targetUid === user.uid).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const sentMsgs = messages.filter(m => m.senderUid === user.uid).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      setToast("Acesso garantido!", "success");
    } catch (e) {
      setToast("Erro no login.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-y-auto">
      <header className="p-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="text-slate-400 p-2"><ChevronLeft /></button>
        <div className="text-center">
           <h1 className="font-black text-slate-800 text-lg italic tracking-tighter uppercase">OFF<span className="text-cyan-500">IN</span> RADAR</h1>
           <div className="flex items-center justify-center gap-1 text-yellow-500 font-black text-[11px] mt-0.5">
             <Coins size={12}/> {userProfile?.tokens || 0} Moedas
           </div>
        </div>
        <div className="flex items-center gap-3">
          {user?.isAnonymous ? (
            <button onClick={handleLogin} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-slate-200">
              <User size={20} />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-md">
               <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </header>

      <div className="flex p-1 mx-6 mt-6 rounded-2xl bg-slate-200/50 border border-slate-200">
        <button onClick={() => setActiveTab('received')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-tighter ${activeTab === 'received' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-400'}`}>
          <Inbox size={14} /> Recebidos ({receivedMsgs.length})
        </button>
        <button onClick={() => setActiveTab('sent')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-tighter ${activeTab === 'sent' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-400'}`}>
          <Send size={14} /> Enviados ({sentMsgs.length})
        </button>
      </div>

      <main className="flex-1 p-6 space-y-4 pb-12">
        {user?.isAnonymous && (
          <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 p-6 rounded-[2.5rem] flex flex-col items-center gap-4 text-center shadow-xl shadow-cyan-500/20">
            <Lock className="text-white/80" size={32} />
            <p className="text-xs font-black text-white leading-tight uppercase tracking-tighter italic">Faça login com o Google para salvar seus segredos e acessar de qualquer lugar!</p>
            <button onClick={handleLogin} className="bg-white text-cyan-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">Conectar Conta Google</button>
          </div>
        )}

        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500" /></div> : 
          (activeTab === 'received' ? receivedMsgs : sentMsgs).length === 0 ? (
            <div className="flex flex-col items-center py-20 opacity-20">
              <Ghost size={60} className="mb-4" />
              <p className="font-black uppercase text-[10px] tracking-widest">Nada por aqui ainda...</p>
            </div>
          ) : (
            (activeTab === 'received' ? receivedMsgs : sentMsgs).map(msg => (
              <div key={msg.id} onClick={() => activeTab === 'received' && onSelectMessage(msg)} className={`bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 transition-all ${activeTab === 'received' ? 'cursor-pointer active:scale-95 hover:border-cyan-200' : 'opacity-80'}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full flex items-center gap-1 ${msg.isRevealed ? 'bg-emerald-100 text-emerald-600' : 'bg-pink-100 text-pink-600'}`}>
                     {msg.isRevealed ? <CheckCircle2 size={10}/> : <Lock size={10}/>}
                     {msg.isRevealed ? 'Identidade Revelada' : 'Segredo Trancado'}
                  </span>
                  {activeTab === 'sent' && (
                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase">
                      {msg.status === 'sent' ? <Clock size={12} /> : <Eye size={12} />}
                      {msg.status === 'sent' ? 'Entregue' : 'Visualizado'}
                    </div>
                  )}
                </div>
                <p className="italic text-slate-700 font-serif text-xl leading-relaxed tracking-tight">"{msg.text}"</p>
                {activeTab === 'received' && !msg.isRevealed && <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-cyan-500 uppercase tracking-widest">Usar Moeda para Revelar <ArrowRight size={14}/></div>}
              </div>
            ))
          )
        }
      </main>
    </div>
  );
};

const ViralPaywallScreen = ({ user, userProfile, message, onUnlock, setToast }) => {
  const [copied, setCopied] = useState(false);
  const tokens = userProfile?.tokens || 0;
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { 
    if (message.isRevealed) onUnlock(); 
    if (message.status === 'sent') updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', message.id), { status: 'viewed' });
  }, [message]);

  const handleUnlock = async () => {
    if (tokens < 1) {
       setToast("Você não tem moedas! Compartilhe seu link para ganhar.");
       return;
    }
    setIsProcessing(true);
    try {
      // 1. Debita a moeda
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), {
        tokens: tokens - 1
      });
      // 2. Revela a mensagem
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'messages', message.id), { 
        isRevealed: true, status: 'revealed' 
      });
      setTimeout(() => onUnlock(), 800);
    } catch(e) {
      setToast("Erro ao processar o pagamento.");
      setIsProcessing(false);
    }
  };

  const handleCopyLink = () => {
    const shareLink = `${APP_URL}?u=${user.uid}`;
    copyToClipboardFallback(shareLink);
    setCopied(true);
    setToast("Link copiado! Poste no Instagram.", "success");
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white p-10 text-center justify-center space-y-12">
      <Lock size={72} className="text-pink-500 mx-auto animate-pulse" />
      <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Quem enviou <br/> esse segredo?</h2>
      <div className="bg-slate-800 p-10 rounded-[3.5rem] border-2 border-slate-700 shadow-2xl relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-6 py-2 rounded-full border border-slate-700 text-[10px] font-black uppercase text-slate-400 tracking-widest">A Mensagem</div>
        <p className="italic text-2xl font-serif text-slate-100 leading-relaxed">"{message.text}"</p>
      </div>
      
      <div className="bg-cyan-900/40 border-2 border-cyan-500/50 p-8 rounded-[3.5rem] space-y-6">
        <div className="flex items-center justify-center gap-2 text-yellow-500 font-black text-lg">
           <Coins size={24}/> {tokens} Moedas
        </div>

        {tokens >= 1 ? (
          <>
            <p className="text-sm font-bold italic leading-relaxed text-cyan-100">Você tem saldo! Clique no botão abaixo para gastar 1 Moeda e revelar a identidade.</p>
            <Button onClick={handleUnlock} loading={isProcessing} icon={Unlock} variant="success">
               Gastar 1 🪙 para Revelar
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm font-bold italic leading-relaxed text-cyan-100 uppercase tracking-tighter">Acabaram suas moedas!</p>
            <p className="text-xs text-slate-400 font-medium">Poste o seu link! Sempre que alguém te enviar um segredo e criar um link através de você, <span className="text-yellow-500 font-bold">você ganha +1 Moeda!</span></p>
            <Button onClick={handleCopyLink} icon={copied ? CheckCircle2 : Copy} variant={copied ? 'success' : 'warning'}>
               {copied ? 'Link Copiado!' : 'Copiar Link para Divulgar'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

const RevealScreen = ({ message, onBack }) => {
  const [isHolding, setIsHolding] = useState(false);
  return (
    <div className="flex flex-col min-h-screen bg-black p-8 text-center justify-center space-y-12 overflow-y-auto">
      <header className="absolute top-8 left-8"><button onClick={onBack} className="p-3 bg-slate-900 rounded-full text-slate-400 hover:text-white transition-colors"><ChevronLeft size={24} /></button></header>
      <div className="bg-slate-900 rounded-[5rem] p-12 relative shadow-[0_0_60px_rgba(0,0,0,0.8)] min-h-[500px] flex flex-col justify-center select-none touch-none border-2 border-slate-800">
        {isHolding ? (
          <div className="animate-in fade-in zoom-in duration-300 space-y-8">
            <div className="w-48 h-48 rounded-full mx-auto border-4 border-cyan-500 overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.3)]">
              <img src={message.senderPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderUid}`} className="w-full h-full object-cover" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em]">O Remetente é:</span>
              <p className="text-4xl font-black italic text-white leading-tight tracking-tighter">{message.senderName}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <ShieldCheck size={96} className="mx-auto text-cyan-500 animate-pulse" />
            <p className="font-black text-2xl text-white uppercase tracking-tight italic">Segure para Ver</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-10">O modo anti-print está ativado por segurança.</p>
          </div>
        )}
      </div>
      <button 
        onMouseDown={() => setIsHolding(true)} onMouseUp={() => setIsHolding(false)}
        onTouchStart={() => setIsHolding(true)} onTouchEnd={() => setIsHolding(false)}
        className={`w-full py-10 rounded-full font-black text-2xl transition-all select-none touch-none shadow-2xl ${isHolding ? 'bg-cyan-800 scale-95 shadow-inner' : 'bg-cyan-500 text-white'}`}
      >
        {isHolding ? 'EXIBINDO...' : '👆 PRESSIONE E SEGURE'}
      </button>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [screen, setScreen] = useState(1);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [targetUid, setTargetUid] = useState(null); 
  const [referrerUid, setReferrerUid] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null); 
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState('error');

  const showToast = (msg, type = 'error') => {
    setToast(msg);
    setToastType(type);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (tokenErr) {
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { 
        console.error("Erro crítico na autenticação:", err); 
      } finally { 
        setLoadingAuth(false); 
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Monitora o perfil do usuário em tempo real (para atualizar saldo de moedas)
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), (d) => {
      if(d.exists()) setUserProfile(d.data());
    }, (error) => {
      console.error("Erro no onSnapshot do perfil:", error);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!loadingAuth && user) {
      const u = new URLSearchParams(window.location.search).get('u');
      if (u) {
        if (u === user.uid) {
          setScreen(4);
        } else { 
          setTargetUid(u); 
          setReferrerUid(u); // Guarda quem indicou
          setScreen(3); 
        }
      }
    }
  }, [loadingAuth, user]);

  if (loadingAuth) return (
    <div className="min-h-screen bg-[#18181b] flex flex-col items-center justify-center gap-6">
      <div className="text-4xl font-black text-white italic tracking-tighter animate-pulse">OFF<span className="text-cyan-500">IN</span></div>
      <Loader2 className="animate-spin text-cyan-500" size={24} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans antialiased overflow-y-auto">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
        {screen === 1 && <CreateLinkScreen user={user} referrerUid={referrerUid} onNext={setScreen} setToast={showToast} />}
        {screen === 2 && <LinkReadyScreen user={user} onNext={setScreen} />}
        {screen === 3 && targetUid && <SendSecretScreen targetUid={targetUid} user={user} onReset={() => setScreen(1)} setToast={showToast} />}
        {screen === 4 && <InboxScreen user={user} userProfile={userProfile} onBack={() => setScreen(1)} onSelectMessage={msg => { setSelectedMessage(msg); setScreen(5); }} setToast={showToast} />}
        {screen === 5 && selectedMessage && <ViralPaywallScreen user={user} userProfile={userProfile} message={selectedMessage} onBack={() => setScreen(4)} onUnlock={() => setScreen(6)} setToast={showToast} />}
        {screen === 6 && selectedMessage && <RevealScreen message={selectedMessage} onBack={() => setScreen(4)} />}
      </div>
      <Toast message={toast} type={toastType} onClose={() => setToast(null)} />
    </div>
  );
}
