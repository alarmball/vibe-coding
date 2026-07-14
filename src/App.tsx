import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, firebaseConfigured, firestore, googleProvider } from './firebase';

interface RunningRecord {
  id: string;
  date: string;
  distance: number;
  duration: number;
  memo: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
}

interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
}

const RUN_COLLECTION = 'run_bolt';
const today = () => new Date().toISOString().slice(0, 10);
const fallbackAvatar = (name = 'R') =>
  `https://ui-avatars.com/api/?background=ff7427&color=fff&name=${encodeURIComponent(name)}`;

function formatPace(distance: number, duration: number) {
  const seconds = Math.round((duration * 60) / distance);
  return `${Math.floor(seconds / 60)}' ${String(seconds % 60).padStart(2, '0')}\"`;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<RunningRecord[]>([]);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ date: today(), distance: '', duration: '', memo: '' });

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!firebaseConfigured) return;
    return onSnapshot(
      query(collection(firestore, RUN_COLLECTION), orderBy('createdAt', 'desc')),
      (snapshot) => setRecords(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as RunningRecord)),
      () => setNotice('피드를 불러오지 못했습니다. Firebase 설정과 보안 규칙을 확인해주세요.'),
    );
  }, []);

  const handleAuth = async () => {
    if (!firebaseConfigured) return setNotice('src/firebase.ts에 Firebase 설정값을 입력해주세요.');
    try { user ? await signOut(auth) : await signInWithPopup(auth, googleProvider); }
    catch (error) { setNotice(`로그인 실패: ${(error as { code?: string }).code ?? 'unknown'}`); }
  };

  const submitRecord = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const distance = Number(form.distance), duration = Number(form.duration);
    if (!form.date || distance <= 0 || duration < 1) return setNotice('날짜, 거리, 시간을 확인해주세요.');
    await addDoc(collection(firestore, RUN_COLLECTION), {
      date: form.date,
      distance,
      duration,
      memo: form.memo.trim(),
      authorId: user.uid,
      authorName: user.displayName || user.email || '러너',
      authorPhoto: user.photoURL || '',
      createdAt: serverTimestamp(),
    });
    setForm({ date: today(), distance: '', duration: '', memo: '' });
  };

  return <>
    <header className="topbar"><div className="shell topbar-inner">
      <div className="brand"><span className="logo">⚡</span><span>Run Bolt</span></div>
      <div className="auth-area">
        {user && <div className="profile"><img src={user.photoURL || fallbackAvatar(user.displayName || '')} alt="프로필" /><b>{user.displayName || user.email}</b></div>}
        <button className="button ghost" onClick={handleAuth}>{user ? '로그아웃' : 'Google 로그인'}</button>
      </div>
    </div></header>

    <main className="shell page">
      <section className="hero"><div><small>RUNNING COMMUNITY</small><h1>오늘의 달리기를 함께 나눠요</h1><p>멤버들의 기록을 확인하고 ⚡ 응원과 댓글을 남겨보세요.</p></div></section>
      {notice && <div className="alert" onClick={() => setNotice('')}>{notice}</div>}
      <div className="record-layout">
        <aside className="panel writer">
          <h2>러닝 기록 작성</h2><p>{user ? '오늘의 러닝 기록을 남겨보세요.' : '로그인하면 기록을 작성할 수 있습니다.'}</p>
          <form onSubmit={submitRecord}>
            <Field label="날짜"><input type="date" value={form.date} disabled={!user} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></Field>
            <div className="form-two">
              <Field label="거리 (km)"><input type="number" min="0.1" step="0.01" value={form.distance} disabled={!user} onChange={(e) => setForm({ ...form, distance: e.target.value })} required /></Field>
              <Field label="시간 (분)"><input type="number" min="1" value={form.duration} disabled={!user} onChange={(e) => setForm({ ...form, duration: e.target.value })} required /></Field>
            </div>
            <Field label="한 줄 메모"><input maxLength={200} value={form.memo} disabled={!user} placeholder="오늘의 러닝은 어땠나요?" onChange={(e) => setForm({ ...form, memo: e.target.value })} /></Field>
            <button className="button full" disabled={!user}>기록 등록</button>
          </form>
        </aside>

        <section><div className="section-head"><h2>전체 러닝 피드</h2><span>{records.length}개의 기록</span></div>
          <div className="record-list">{records.length ? records.map((record) => <RecordCard key={record.id} record={record} user={user} notify={setNotice} />) : <div className="empty">아직 등록된 러닝 기록이 없습니다.</div>}</div>
        </section>
      </div>
    </main>
  </>;
}

function RecordCard({ record, user, notify }: { record: RunningRecord; user: User | null; notify: (text: string) => void }) {
  const [sparkUsers, setSparkUsers] = useState<string[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => onSnapshot(
    collection(firestore, RUN_COLLECTION, record.id, 'sparks'),
    (snapshot) => setSparkUsers(snapshot.docs.map((item) => item.id)),
  ), [record.id]);

  useEffect(() => onSnapshot(
    query(collection(firestore, RUN_COLLECTION, record.id, 'comments'), orderBy('createdAt', 'asc')),
    (snapshot) => setComments(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Comment)),
  ), [record.id]);

  const pressed = !!user && sparkUsers.includes(user.uid);
  const toggleSpark = async () => {
    if (!user) return notify('⚡ 응원은 로그인 후 누를 수 있습니다.');
    const sparkRef = doc(firestore, RUN_COLLECTION, record.id, 'sparks', user.uid);
    pressed
      ? await deleteDoc(sparkRef)
      : await setDoc(sparkRef, { uid: user.uid, createdAt: serverTimestamp() });
  };

  const addComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !commentText.trim()) return;
    await addDoc(collection(firestore, RUN_COLLECTION, record.id, 'comments'), {
      text: commentText.trim(),
      authorId: user.uid,
      authorName: user.displayName || user.email || '러너',
      createdAt: serverTimestamp(),
    });
    setCommentText('');
  };

  const removeRecord = async () => {
    if (user?.uid === record.authorId && confirm('이 기록을 삭제할까요?'))
      await deleteDoc(doc(firestore, RUN_COLLECTION, record.id));
  };

  return <article className="record-card">
    <div className="record-main">
      <div className="record-meta"><div className="record-author"><img src={record.authorPhoto || fallbackAvatar(record.authorName)} alt="" /><span><b>{record.authorName}</b><small>{record.date}</small></span></div>{user?.uid === record.authorId && <button className="delete" onClick={removeRecord}>기록 삭제</button>}</div>
      <div className="metrics"><Metric label="DISTANCE" value={`${record.distance} km`} /><Metric label="TIME" value={`${record.duration}분`} /><Metric label="AVG PACE" value={formatPace(record.distance, record.duration)} /></div>
      <p className="memo">{record.memo || '오늘도 완주!'}</p>
      <button className={pressed ? 'spark mine' : 'spark'} aria-pressed={pressed} onClick={toggleSpark}>⚡ {sparkUsers.length}</button>
    </div>
    <section className="comments"><h4>댓글 {comments.length}개</h4>
      {comments.map((comment) => <div className="comment" key={comment.id}><span><b>{comment.authorName}</b> {comment.text}</span>{user?.uid === comment.authorId && <button className="delete" onClick={() => deleteDoc(doc(firestore, RUN_COLLECTION, record.id, 'comments', comment.id))}>삭제</button>}</div>)}
      <form className="inline-form" onSubmit={addComment}><input value={commentText} disabled={!user} maxLength={300} placeholder={user ? '댓글을 입력하세요' : '로그인한 사용자만 작성할 수 있습니다'} onChange={(e) => setCommentText(e.target.value)} /><button className="button" disabled={!user}>등록</button></form>
    </section>
  </article>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><small>{label}</small><strong>{value}</strong></div>;
}
