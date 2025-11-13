import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Medication, GroundingChunk, ExamRecord, PurchaseRecord, DocumentRecord, FoodPreferenceDB, MedicationLog } from '../../types';
import { getMedicationInfo, analyzeExamImage, analyzeReceiptImage, getFeedbackOnPurchases, categorizeFoodPreference } from '../../services/api';
import { fileToBase64 } from '../../utils';
import { supabase } from '../../lib/supabaseClient';

type DiaryView = 'main' | 'meds' | 'exams' | 'purchases' | 'tastes' | 'docs';


// --- Meds Section ---
const MedsSection: React.FC<{onBack: () => void}> = ({ onBack }) => {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [medLog, setMedLog] = useState<MedicationLog[]>([]);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [medInfo, setMedInfo] = useState<{ text: string, sources: GroundingChunk[] } | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const fetchMeds = useCallback(async () => {
    const { data, error } = await supabase.from('medications').select('*');
    if (error) console.error('Error fetching meds', error);
    else setMeds(data || []);

    const { data: logData, error: logError } = await supabase.from('medication_log').select('*').eq('taken_at', today);
    if (logError) console.error('Error fetching med log', logError);
    else setMedLog(logData || []);
  }, [today]);

  useEffect(() => {
    fetchMeds();
  }, [fetchMeds]);

  const isMedTaken = (medId: string) => {
    return medLog.some(log => log.medication_id === medId);
  }

  const toggleTaken = async (medId: string) => {
    if (isMedTaken(medId)) {
        // Untake - Delete the log entry
        const { error } = await supabase.from('medication_log').delete().match({ medication_id: medId, taken_at: today });
        if (error) console.error('Error un-taking med', error);
        else setMedLog(prev => prev.filter(log => log.medication_id !== medId));
    } else {
        // Take - Insert a log entry
        const { data, error } = await supabase.from('medication_log').insert({ medication_id: medId, taken_at: today }).select().single();
        if (error) console.error('Error taking med', error);
        else if (data) setMedLog(prev => [...prev, data]);
    }
  };

  const handleSelectMed = async (med: Medication) => {
    setSelectedMed(med);
    setIsLoadingInfo(true);
    setMedInfo(null);
    try {
      const info = await getMedicationInfo(med.name);
      setMedInfo(info);
    } catch (error) {
      console.error('Error fetching medication info:', error);
      setMedInfo({ text: 'Não foi possível buscar as informações. Tente novamente.', sources: [] });
    } finally {
      setIsLoadingInfo(false);
    }
  };

    return (
        <div className="p-6">
            <button onClick={onBack} className="text-teal-600 font-bold text-2xl mb-6">&larr; Voltar para o Diário</button>
            <h2 className="text-4xl font-bold text-gray-800 mb-6">Meus Remédios</h2>
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <ul className="space-y-4">
                {meds.map(med => {
                    const taken = isMedTaken(med.id);
                    return (
                    <li key={med.id} className={`p-4 rounded-xl transition-all duration-300 ${taken ? 'bg-green-100' : 'bg-gray-50 border'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                        <p className={`font-bold text-2xl ${taken ? 'text-green-800 line-through' : 'text-gray-800'}`}>{med.name}</p>
                        <p className="text-xl text-gray-600">{med.dosage} - {med.time}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                        <button onClick={() => handleSelectMed(med)} className="text-sky-600 hover:text-sky-800 p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                        <button onClick={() => toggleTaken(med.id)} className={`px-6 py-3 rounded-lg font-bold text-white text-xl ${taken ? 'bg-gray-400' : 'bg-teal-600 hover:bg-teal-700'}`}>
                            {taken ? 'Tomado' : 'Tomei'}
                        </button>
                        </div>
                    </div>
                    </li>
                )})}
                </ul>
                <button className="w-full mt-6 bg-teal-100 text-teal-800 font-bold py-4 px-4 rounded-xl text-2xl hover:bg-teal-200" onClick={() => alert('Função a ser implementada')}>
                    + Adicionar Remédio
                </button>
            </div>
            {selectedMed && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Sobre: {selectedMed.name}</h2>
                {isLoadingInfo && <p className="text-xl">Buscando informações...</p>}
                {medInfo && (
                    <div>
                    <p className="text-xl leading-relaxed whitespace-pre-wrap">{medInfo.text}</p>
                    {medInfo.sources.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-bold text-xl text-gray-700">Fontes:</h3>
                            <ul className="list-disc pl-6 space-y-2 mt-2">
                                {medInfo.sources.map((source, index) => source.web && (
                                    <li key={index}><a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-lg">{source.web.title}</a></li>
                                ))}
                            </ul>
                        </div>
                    )}
                    </div>
                )}
                </div>
            )}
        </div>
    )
}

// --- Exams Section ---
const ExamsSection: React.FC<{ onBack: () => void; }> = ({ onBack }) => {
    const [exams, setExams] = useState<ExamRecord[]>([]);
    const [selectedExam, setSelectedExam] = useState<ExamRecord | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchExams = useCallback(async () => {
        const { data, error } = await supabase.from('exam_records').select('*').order('date', { ascending: false });
        if (error) console.error('Error fetching exams', error);
        else setExams(data || []);
    }, []);

    useEffect(() => {
        fetchExams();
    }, [fetchExams]);

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsLoading(true);
            setError(null);
            setSelectedExam(null);
            try {
                const base64Image = await fileToBase64(file);
                const extractedData = await analyzeExamImage(base64Image, file.type);

                const { data: user } = await supabase.auth.getUser();
                const filePath = `${user?.user?.id}/${Date.now()}-${file.name}`;
                const { error: uploadError } = await supabase.storage.from('exams').upload(filePath, file);
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('exams').getPublicUrl(filePath);

                const { data: newRecord, error: insertError } = await supabase.from('exam_records').insert({
                    ...extractedData,
                    image_url: publicUrl,
                    date: new Date(extractedData.date.split('/').reverse().join('-')).toISOString(),
                }).select().single();

                if (insertError) throw insertError;
                if(newRecord) setExams(prev => [newRecord, ...prev]);

            } catch (err: any) {
                console.error(err);
                setError(err.message || "Não consegui ler ou salvar os dados do exame. Tente uma foto mais nítida, por favor.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const ResultRow: React.FC<{ label: string, value: number | undefined | null, unit: string, normalRange: string, isBad: (val: number) => boolean }> = 
        ({ label, value, unit, normalRange, isBad }) => (
        <div className={`flex justify-between items-center p-4 rounded-lg ${value && isBad(value) ? 'bg-red-100' : 'bg-gray-50'}`}>
            <div>
                <p className="font-bold text-2xl text-gray-800">{label}</p>
                <p className="text-lg text-gray-600">Normal: {normalRange}</p>
            </div>
            {value !== undefined && value !== null ? (
                 <p className={`font-bold text-3xl ${isBad(value) ? 'text-red-600' : 'text-green-700'}`}>{value.toFixed(2)} <span className="text-xl">{unit}</span></p>
            ) : (
                <p className="font-bold text-2xl text-gray-500">N/A</p>
            )}
        </div>
    );
    

    if (selectedExam) {
        return (
            <div className="p-6">
                <button onClick={() => setSelectedExam(null)} className="text-teal-600 font-bold text-2xl mb-6">&larr; Voltar para a lista</button>
                <h2 className="text-4xl font-bold text-gray-800 mb-6">Exame de {new Date(selectedExam.date).toLocaleDateString('pt-BR')}</h2>
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 space-y-4">
                    <ResultRow label="Potássio" value={selectedExam.potassium} unit="mEq/L" normalRange="3.5 - 5.2" isBad={(v) => v > 5.2 || v < 3.5} />
                    <ResultRow label="Glicose" value={selectedExam.glucose} unit="mg/dL" normalRange="70 - 99" isBad={(v) => v > 99} />
                    <ResultRow label="Creatinina" value={selectedExam.creatinine} unit="mg/dL" normalRange="0.6 - 1.2" isBad={(v) => v > 1.2} />
                </div>
                <img src={selectedExam.image_url} alt={`Exame de ${selectedExam.date}`} className="rounded-2xl shadow-lg w-full" />
            </div>
        )
    }

    return (
        <div className="p-6">
            <button onClick={onBack} className="text-teal-600 font-bold text-2xl mb-6">&larr; Voltar para o Diário</button>
            <h2 className="text-4xl font-bold text-gray-800 mb-6">Meus Exames</h2>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="w-full bg-teal-600 text-white font-bold py-5 px-4 rounded-xl text-2xl hover:bg-teal-700 disabled:bg-gray-400 flex items-center justify-center space-x-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>{isLoading ? 'Analisando Foto...' : 'Fotografar Novo Exame'}</span>
                </button>
                {isLoading && <p className="text-center mt-4 text-xl text-gray-700">O Guardião está lendo seu exame, aguarde...</p>}
                {error && <p className="text-center mt-4 text-xl text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
            </div>

             <div className="space-y-4">
                {exams.length === 0 && !isLoading && (
                    <div className="text-center p-10 bg-gray-50 rounded-2xl">
                        <p className="text-2xl text-gray-600">Nenhum exame registrado.</p>
                        <p className="text-xl text-gray-500 mt-2">Use o botão acima para adicionar seu primeiro exame.</p>
                    </div>
                )}
                {exams.map(exam => (
                    <button key={exam.id} onClick={() => setSelectedExam(exam)} className="w-full bg-white rounded-2xl shadow-lg p-6 text-left hover:shadow-xl hover:bg-teal-50 transition-all duration-300">
                        <p className="font-bold text-3xl text-gray-800">Exame de {new Date(exam.date).toLocaleDateString('pt-BR')}</p>
                        <p className="text-xl text-gray-600 mt-1">Clique para ver os detalhes</p>
                    </button>
                ))}
            </div>
        </div>
    );
};


// --- Purchases Section ---
const PurchasesSection: React.FC<{ onBack: () => void; }> = ({ onBack }) => {
    const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
    const [view, setView] = useState<'list' | 'confirm'>('list');
    const [currentItems, setCurrentItems] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [newItem, setNewItem] = useState('');

    const fetchPurchases = useCallback(async () => {
        const { data, error } = await supabase.from('purchase_records').select('*').order('date', { ascending: false });
        if (error) console.error('Error fetching purchases', error);
        else setPurchases(data || []);
    }, []);

    useEffect(() => {
        fetchPurchases();
    }, [fetchPurchases]);

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsLoading(true);
            setError(null);
            try {
                const base64Image = await fileToBase64(file);
                const items = await analyzeReceiptImage(base64Image, file.type);
                setCurrentItems(items);
                setView('confirm');
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Não consegui ler a nota fiscal. Tente uma foto mais nítida ou adicione os itens manualmente.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSavePurchase = async () => {
        if (currentItems.length === 0) return;
        setIsLoading(true);
        setError(null);
        try {
            const feedback = await getFeedbackOnPurchases(currentItems);
            const newPurchase = {
                date: new Date().toISOString(),
                items: currentItems,
                feedback: feedback,
            };
            const { data: savedPurchase, error } = await supabase.from('purchase_records').insert(newPurchase).select().single();
            if (error) throw error;

            setPurchases(prev => [savedPurchase, ...prev]);
            setView('list');
            setCurrentItems([]);
        } catch (err: any) {
             console.error(err);
             setError(err.message || "Não consegui gerar as dicas para esta compra. Por favor, tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAddItem = () => {
        if (newItem.trim()) {
            setCurrentItems([...currentItems, newItem.trim()]);
            setNewItem('');
        }
    };
    
    const handleRemoveItem = (index: number) => {
        setCurrentItems(currentItems.filter((_, i) => i !== index));
    };

    if (view === 'confirm') {
        return (
            <div className="p-6">
                <button onClick={() => setView('list')} className="text-teal-600 font-bold text-2xl mb-6">&larr; Cancelar</button>
                <h2 className="text-4xl font-bold text-gray-800 mb-6">Confirme os Itens</h2>
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    {currentItems.length > 0 ? (
                        <ul className="space-y-3 mb-4">
                            {currentItems.map((item, index) => (
                                <li key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                    <span className="text-xl text-gray-800">{item}</span>
                                    <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-center text-xl text-gray-500 mb-4">Nenhum item adicionado ainda.</p>}
                    
                    <div className="flex space-x-2">
                        <input 
                            type="text" 
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            placeholder="Adicionar item..."
                            className="flex-grow p-3 border-2 border-gray-300 rounded-lg text-xl"
                        />
                        <button onClick={handleAddItem} className="bg-teal-500 text-white font-bold p-3 rounded-lg text-xl">+</button>
                    </div>

                    <button onClick={handleSavePurchase} disabled={isLoading || currentItems.length === 0} className="w-full mt-6 bg-green-600 text-white font-bold py-5 px-4 rounded-xl text-2xl hover:bg-green-700 disabled:bg-gray-400">
                        {isLoading ? 'Gerando Dicas...' : 'Salvar Compra e Ver Dicas'}
                    </button>
                    {error && <p className="text-center mt-4 text-xl text-red-600">{error}</p>}
                </div>
            </div>
        )
    }

    return (
         <div className="p-6">
            <button onClick={onBack} className="text-teal-600 font-bold text-2xl mb-6">&larr; Voltar para o Diário</button>
            <h2 className="text-4xl font-bold text-gray-800 mb-6">Minhas Compras</h2>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 space-y-4">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                 <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="w-full bg-teal-600 text-white font-bold py-5 px-4 rounded-xl text-2xl hover:bg-teal-700 disabled:bg-gray-400 flex items-center justify-center space-x-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>{isLoading ? 'Lendo...' : 'Fotografar Nota Fiscal'}</span>
                </button>
                <button onClick={() => setView('confirm')} disabled={isLoading} className="w-full bg-orange-500 text-white font-bold py-5 px-4 rounded-xl text-2xl hover:bg-orange-600 disabled:bg-gray-400">
                    Adicionar Itens Manualmente
                </button>
                {isLoading && <p className="text-center mt-4 text-xl text-gray-700">Aguarde...</p>}
                {error && <p className="text-center mt-4 text-xl text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
            </div>

            <div className="space-y-4">
                {purchases.length === 0 && (
                    <div className="text-center p-10 bg-gray-50 rounded-2xl">
                        <p className="text-2xl text-gray-600">Nenhuma compra registrada.</p>
                    </div>
                )}
                {purchases.map(purchase => (
                    <div key={purchase.id} className="bg-white rounded-2xl shadow-lg p-6">
                        <p className="font-bold text-3xl text-gray-800">Compra de {new Date(purchase.date).toLocaleDateString('pt-BR')}</p>
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <p className="font-semibold text-2xl text-blue-800 mb-2">Dica do Guardião:</p>
                            <p className="text-xl text-blue-900">{purchase.feedback}</p>
                        </div>
                        <details className="mt-4">
                            <summary className="font-semibold text-xl text-gray-700 cursor-pointer">Ver itens ({purchase.items.length})</summary>
                            <ul className="list-disc pl-8 mt-2 space-y-1 text-xl text-gray-600">
                                {purchase.items.map((item, index) => <li key={index}>{item}</li>)}
                            </ul>
                        </details>
                    </div>
                ))}
            </div>

        </div>
    );
}

// --- Tastes Section ---
const TastesSection: React.FC<{onBack: () => void;}> = ({ onBack }) => {
    const [preferences, setPreferences] = useState<FoodPreferenceDB[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPrefs = useCallback(async () => {
        const { data, error } = await supabase.from('food_preferences').select('*');
        if(error) console.error(error);
        else setPreferences(data || []);
    }, []);

    useEffect(() => {
        fetchPrefs();
    }, [fetchPrefs]);

    const handleAddPreference = async () => {
        if (!inputText.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await categorizeFoodPreference(inputText);
            if (result.preference === 'like' || result.preference === 'dislike') {
                const { data, error } = await supabase
                    .from('food_preferences')
                    .upsert({ food: result.food, preference: result.preference }, { onConflict: 'food' })
                    .select()
                    .single();
                if (error) throw error;
                if(data) {
                    // Update local state
                    setPreferences(prev => {
                        const existing = prev.find(p => p.food === data.food);
                        if (existing) {
                            return prev.map(p => p.food === data.food ? data : p);
                        }
                        return [...prev, data];
                    });
                }
            } else {
                setError('Não consegui entender, Dona Cyca. Pode tentar dizer de outra forma? Ex: "Gosto de banana" ou "Não como jiló".');
            }
            setInputText('');
        } catch(err: any) {
            console.error(err);
            setError(err.message || "Ocorreu um erro ao salvar a preferência. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async (food: string) => {
        const { error } = await supabase.from('food_preferences').delete().eq('food', food);
        if (error) console.error('Error removing preference', error);
        else setPreferences(prev => prev.filter(p => p.food !== food));
    };
    
    const PreferenceList: React.FC<{title: string, items: string[], emoji: string, onRemove: (item: string) => void, className: string}> = ({title, items, emoji, onRemove, className}) => (
        <div className={`rounded-2xl p-4 ${className}`}>
            <h3 className="font-bold text-3xl mb-4 text-gray-800">{title} {emoji}</h3>
            {items.length === 0 ? <p className="text-xl text-gray-600">Nenhum item ainda.</p> : (
            <div className="flex flex-wrap gap-3">
                {items.map(item => (
                    <div key={item} className="bg-white/80 rounded-full flex items-center pl-4 pr-2 py-2 shadow-sm">
                        <span className="text-xl font-medium text-gray-800 capitalize">{item}</span>
                        <button onClick={() => onRemove(item)} className="ml-2 text-red-500 hover:text-red-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                ))}
            </div>
            )}
        </div>
    );

    const liked = preferences.filter(p => p.preference === 'like').map(p => p.food);
    const disliked = preferences.filter(p => p.preference === 'dislike').map(p => p.food);

    return (
        <div className="p-6">
            <button onClick={onBack} className="text-teal-600 font-bold text-2xl mb-6">&larr; Voltar para o Diário</button>
            <h2 className="text-4xl font-bold text-gray-800 mb-2">Meus Gostos</h2>
            <p className="text-xl text-gray-700 mb-6">Diga ao Guardião o que a senhora gosta ou não gosta. Ele vai se lembrar para as próximas sugestões!</p>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                 <div className="flex items-center space-x-3">
                    <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder='Ex: "Adoro sopa de abóbora"'
                        className="flex-grow w-full p-4 border-2 border-gray-300 rounded-xl text-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    />
                    <button 
                        onClick={handleAddPreference} 
                        disabled={isLoading} 
                        className="flex-shrink-0 bg-teal-600 text-white font-bold px-8 py-4 rounded-xl text-xl hover:bg-teal-700 disabled:bg-gray-400 transition-all duration-300"
                        aria-label="Adicionar preferência"
                    >
                        {isLoading ? '...' : 'Adicionar'}
                    </button>
                </div>
                 {error && <p className="text-center mt-4 text-xl text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PreferenceList title="Gosto" emoji="👍" items={liked} onRemove={(item) => handleRemove(item)} className="bg-green-100 border-2 border-green-200" />
                <PreferenceList title="Não Gosto" emoji="👎" items={disliked} onRemove={(item) => handleRemove(item)} className="bg-red-100 border-2 border-red-200" />
            </div>

        </div>
    );
}


// --- Docs Section ---
const DocsSection: React.FC<{ onBack: () => void; }> = ({ onBack }) => {
    const [documents, setDocuments] = useState<DocumentRecord[]>([]);
    const [newDoc, setNewDoc] = useState<{ file: File, imageUrl: string, title: string } | null>(null);
    const [viewingDoc, setViewingDoc] = useState<DocumentRecord | null>(null);
    const [isUploadOptionsOpen, setIsUploadOptionsOpen] = useState(false);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchDocs = useCallback(async () => {
        const { data, error } = await supabase.from('document_records').select('*').order('created_at', { ascending: false });
        if (error) console.error('Error fetching docs', error);
        else setDocuments(data || []);
    }, []);

    useEffect(() => {
        fetchDocs();
    }, [fetchDocs]);


    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setNewDoc({ file, imageUrl, title: '' });
            setIsUploadOptionsOpen(false);
        }
    };

    const handleSaveDoc = async () => {
        if (!newDoc || !newDoc.title.trim()) {
            alert("Por favor, dê um nome ao documento.");
            return;
        }
        setIsLoading(true);
        try {
            const { data: user } = await supabase.auth.getUser();
            const filePath = `${user?.user?.id}/docs/${Date.now()}-${newDoc.file.name}`;
            const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, newDoc.file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);

            const { data, error } = await supabase.from('document_records').insert({ title: newDoc.title, image_url: publicUrl }).select().single();
            if (error) throw error;

            setDocuments(prev => [data, ...prev]);
            setNewDoc(null);
        } catch(error) {
            console.error('Error saving document:', error);
            alert('Não foi possível salvar o documento.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDeleteDoc = async (doc: DocumentRecord) => {
        if (window.confirm("Tem certeza que quer apagar este documento?")) {
            const { error } = await supabase.from('document_records').delete().eq('id', doc.id);
            if (error) {
                console.error('Error deleting db record:', error);
                alert('Não foi possível apagar o registro.');
                return;
            }

            const path = new URL(doc.image_url).pathname.split('/documents/')[1];
            const { error: storageError } = await supabase.storage.from('documents').remove([path]);
             if (storageError) {
                console.error('Error deleting file from storage:', storageError);
            }

            setDocuments(prev => prev.filter(d => d.id !== doc.id));
        }
    };

    if (viewingDoc) {
        return (
            <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={() => setViewingDoc(null)}>
                <img src={viewingDoc.image_url} alt={viewingDoc.title} className="max-w-full max-h-full object-contain" />
                <button onClick={() => setViewingDoc(null)} className="absolute top-4 right-4 bg-white rounded-full p-3 text-gray-800 text-3xl font-bold leading-none">
                    &times;
                </button>
            </div>
        );
    }

    if (newDoc) {
        return (
            <div className="p-6">
                 <button onClick={() => setNewDoc(null)} className="text-teal-600 font-bold text-2xl mb-6">&larr; Cancelar</button>
                 <h2 className="text-4xl font-bold text-gray-800 mb-6">Salvar Novo Documento</h2>
                 <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                    <img src={newDoc.imageUrl} alt="Novo documento" className="rounded-xl w-full" />
                     <label htmlFor="doc-title" className="font-bold text-2xl text-gray-800">Qual o nome deste documento?</label>
                    <input 
                        id="doc-title"
                        type="text"
                        value={newDoc.title}
                        onChange={(e) => setNewDoc({...newDoc, title: e.target.value })}
                        placeholder="Ex: Receita do Dr. Carlos"
                        className="w-full p-4 border-2 border-gray-300 rounded-xl text-xl"
                    />
                    <button onClick={handleSaveDoc} disabled={isLoading} className="w-full bg-green-600 text-white font-bold py-5 px-4 rounded-xl text-2xl hover:bg-green-700 disabled:bg-gray-400">
                        { isLoading ? 'Salvando...' : 'Salvar Documento' }
                    </button>
                 </div>
            </div>
        );
    }
    
    return (
        <div className="p-6">
            <button onClick={onBack} className="text-teal-600 font-bold text-2xl mb-6">&larr; Voltar para o Diário</button>
            <h2 className="text-4xl font-bold text-gray-800 mb-6">Meus Documentos</h2>

            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleImageChange} className="hidden" />
                <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleImageChange} className="hidden" />
                <button onClick={() => setIsUploadOptionsOpen(true)} className="w-full bg-teal-600 text-white font-bold py-5 px-4 rounded-xl text-2xl hover:bg-teal-700 flex items-center justify-center space-x-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Adicionar Novo Documento</span>
                </button>
            </div>
            
            {isUploadOptionsOpen && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-end" onClick={() => setIsUploadOptionsOpen(false)}>
                    <div className="bg-white w-full rounded-t-2xl p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">De onde vem o documento?</h3>
                        <div className="space-y-4">
                            <button onClick={() => cameraInputRef.current?.click()} className="w-full bg-gray-100 text-gray-800 font-bold py-5 px-4 rounded-xl text-2xl hover:bg-gray-200 flex items-center justify-center space-x-3">
                                <span>📸</span>
                                <span>Tirar Foto Agora</span>
                            </button>
                             <button onClick={() => galleryInputRef.current?.click()} className="w-full bg-gray-100 text-gray-800 font-bold py-5 px-4 rounded-xl text-2xl hover:bg-gray-200 flex items-center justify-center space-x-3">
                                <span>🖼️</span>
                                <span>Escolher da Galeria</span>
                            </button>
                            <button onClick={() => setIsUploadOptionsOpen(false)} className="w-full bg-gray-300 text-gray-900 font-bold py-4 px-4 rounded-xl text-2xl hover:bg-gray-400 mt-6">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {documents.length === 0 && (
                    <div className="col-span-full text-center p-10 bg-gray-50 rounded-2xl">
                        <p className="text-2xl text-gray-600">Nenhum documento guardado.</p>
                    </div>
                )}
                {documents.map(doc => (
                    <div key={doc.id} className="relative group bg-white rounded-xl shadow-md overflow-hidden">
                        <button onClick={() => setViewingDoc(doc)} className="w-full h-full">
                            <img src={doc.image_url} alt={doc.title} className="w-full h-32 object-cover" />
                            <div className="p-3">
                                <p className="font-semibold text-lg text-gray-800 truncate">{doc.title}</p>
                            </div>
                        </button>
                         <button onClick={() => handleDeleteDoc(doc)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- Main Diary Screen ---
const DiaryScreen: React.FC = () => {
    const [view, setView] = useState<DiaryView>('main');

    const MenuButton: React.FC<{title: string, description: string, onClick: () => void, icon: string}> = ({ title, description, onClick, icon }) => (
        <button onClick={onClick} className="bg-white rounded-2xl shadow-lg p-6 text-left flex items-center space-x-6 hover:shadow-xl hover:bg-teal-50 transition-all duration-300">
            <span className="text-5xl">{icon}</span>
            <div>
                <h3 className="text-3xl font-bold text-gray-800">{title}</h3>
                <p className="text-xl text-gray-600 mt-1">{description}</p>
            </div>
        </button>
    );

    if (view === 'meds') return <MedsSection onBack={() => setView('main')} />;
    if (view === 'exams') return <ExamsSection onBack={() => setView('main')} />;
    if (view === 'purchases') return <PurchasesSection onBack={() => setView('main')} />;
    if (view === 'tastes') return <TastesSection onBack={() => setView('main')} />;
    if (view === 'docs') return <DocsSection onBack={() => setView('main')} />;

    return (
        <div className="p-6">
        <h1 className="text-5xl font-bold text-center text-teal-800 mb-8">Meu Diário</h1>
        <div className="space-y-6">
            <MenuButton 
                title="Meus Remédios" 
                description="Veja, adicione e controle seus medicamentos."
                icon="💊"
                onClick={() => setView('meds')} 
            />
            <MenuButton 
                title="Meus Exames" 
                description="Fotografe seus exames e deixe o Guardião analisar."
                icon="🩸"
                onClick={() => setView('exams')} 
            />
            <MenuButton 
                title="Minhas Compras" 
                description="Registre suas compras para receber dicas."
                icon="🛒"
                onClick={() => setView('purchases')} 
            />
            <MenuButton 
                title="Meus Gostos" 
                description="Conte ao Guardião o que você gosta de comer."
                icon="😋"
                onClick={() => setView('tastes')} 
            />
            <MenuButton 
                title="Meus Documentos" 
                description="Guarde fotos de documentos importantes."
                icon="📄"
                onClick={() => setView('docs')} 
            />
        </div>
        </div>
    );
};

export default DiaryScreen;
