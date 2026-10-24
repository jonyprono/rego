import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import SignaturePad from '../components/SignaturePad';
import PhotoUploader from '../components/PhotoUploader';
import { Save, Plus, Trash2, ArrowLeft, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import axios from 'axios';
import { generateReportPDF } from '../utils/pdfGenerator';
import { useAuth } from '../context/AuthContext';
import { BENIN_DEPARTMENTS, getCommunesByDepartment } from '../constants/locations';

type FormData = {
  date: string;
  interventionType: string;
  startTime: string;
  endTime: string;
  duration: string;
  price: string;
  quarter: string;
  clientName: string;
  agencyName: string;
  clientAddress: string;
  clientDepartment: string;
  clientCommune: string;
  technicians: { fullName: string; techId: string }[];
  problemsEncountered: string;
  situationBefore: string;
  solutionProvided: string;
  situationAfter: string;
  remarks: string;
  technicianName: string;
  itManagerName: string;
  itManagerDepartment: string;
  clientRepresentative: string;
  representativeRole: string;
};

const Section = ({ title, children, step }: { title: string; children: React.ReactNode; step: number }) => (
  <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden mb-8">
    <div className="bg-gray-50/80 backdrop-blur-sm px-6 py-4 border-b border-gray-100/80 flex items-center space-x-3">
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-sm">
        {step}
      </span>
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

export default function CreateReport() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { user } = useAuth();

  // Signatures
  const [technicianSignature, setTechnicianSignature] = useState<string | null>(null);
  const [itManagerSignature, setItManagerSignature] = useState<string | null>(null);
  const [clientSignature, setClientSignature] = useState<string | null>(null);

  // Mode de visa Responsable Informatique (sur place vs en ligne à distance)
  const [itSignOnSite, setItSignOnSite] = useState<boolean>(true);

  // Photos
  const [photosBefore, setPhotosBefore] = useState<File[]>([]);
  const [photosAfter, setPhotosAfter] = useState<File[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width;
          let h = img.height;
          const maxDim = 1200;
          if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w = w * ratio;
            h = h * ratio;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve(reader.result as string);
          }
        };
        img.onerror = () => resolve(reader.result as string);
        img.src = reader.result as string;
      };
      reader.onerror = error => reject(error);
    });
  };

  const { register, control, handleSubmit, watch, setValue, reset } = useForm<FormData>({
    defaultValues: {
      technicians: [{ fullName: user ? `${user.firstName} ${user.lastName}` : '', techId: '' }],
      technicianName: user ? `${user.firstName} ${user.lastName}` : '',
      date: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '17:00',
      clientDepartment: 'Littoral',
      clientCommune: 'Cotonou',
      itManagerDepartment: 'Littoral',
      itManagerName: '',
      clientRepresentative: '',
      representativeRole: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'technicians'
  });

  // Watch department to dynamically update communes
  const selectedDepartment = watch('clientDepartment') || 'Littoral';
  const availableCommunes = getCommunesByDepartment(selectedDepartment);

  // Calculate duration automatically
  const startTime = watch('startTime');
  const endTime = watch('endTime');

  const calculateDuration = () => {
    if (!startTime || !endTime) return '0';
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    let diff = (end.getTime() - start.getTime()) / 1000 / 60 / 60; // in hours
    if (diff < 0) diff += 24; // Handle overnight
    return diff.toFixed(2);
  };

  useEffect(() => {
    if (isEditMode) {
      const fetchReport = async () => {
        try {
          const token = localStorage.getItem('token');
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
          const response = await axios.get(`${API_URL}/reports/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = response.data;
          
          reset({
            date: new Date(data.date).toISOString().split('T')[0],
            interventionType: data.interventionType,
            startTime: data.startTime,
            endTime: data.endTime,
            duration: data.duration.toString(),
            price: data.price?.toString() || '',
            quarter: data.quarter || '',
            clientName: data.clientName,
            agencyName: data.agencyName || '',
            clientAddress: data.clientAddress,
            clientDepartment: data.clientDepartment || 'Littoral',
            clientCommune: data.clientCommune || '',
            technicians: data.technicians?.length > 0 ? data.technicians : [{ fullName: '', techId: '' }],
            problemsEncountered: data.problemsEncountered || '',
            solutionProvided: data.solutionProvided || '',
            remarks: data.remarks || '',
            technicianName: data.technicianName || '',
            itManagerName: data.itManagerName || '',
            itManagerDepartment: data.itManagerDepartment || data.clientDepartment || 'Littoral',
            clientRepresentative: data.clientRepresentative || '',
            representativeRole: data.representativeRole || ''
          });

          if (data.technicianSignature) setTechnicianSignature(data.technicianSignature);
          if (data.itManagerSignature) {
            setItManagerSignature(data.itManagerSignature);
            setItSignOnSite(true);
          } else {
            setItSignOnSite(false);
          }
          if (data.clientSignature) setClientSignature(data.clientSignature);
          
        } catch (e) {
          console.error("Erreur chargement rapport", e);
          alert("Impossible de charger le rapport");
        } finally {
          setIsLoading(false);
        }
      };
      fetchReport();
    }
  }, [id, isEditMode, reset]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      // Convert photos to base64
      const base64Before = await Promise.all(photosBefore.map(fileToBase64));
      const base64After = await Promise.all(photosAfter.map(fileToBase64));
      const base64Presence = await Promise.all(photos.map(fileToBase64));

      // Determine final status
      const willHaveItSignature = itSignOnSite && Boolean(itManagerSignature);
      const computedStatus = willHaveItSignature ? 'VALIDE' : 'EN_ATTENTE_SIGNATURE';

      const payload: any = {
        ...data,
        itManagerDepartment: data.itManagerDepartment || data.clientDepartment,
        status: computedStatus,
        technicians: data.technicians.map((t, index) => ({
          fullName: t.fullName,
          techId: t.techId || `TECH-${Date.now().toString().slice(-4)}${index}`
        })),
        duration: calculateDuration(),
      };

      if (base64Before.length > 0) payload.situationBefore = JSON.stringify(base64Before);
      if (base64After.length > 0) payload.situationAfter = JSON.stringify(base64After);
      if (base64Presence.length > 0) payload.presencePhotos = JSON.stringify(base64Presence);
      
      if (technicianSignature) payload.technicianSignature = technicianSignature;
      if (willHaveItSignature) {
        payload.itManagerSignature = itManagerSignature;
      } else {
        payload.itManagerSignature = null;
      }
      if (clientSignature) payload.clientSignature = clientSignature;

      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      let response;
      if (isEditMode) {
        response = await axios.put(`${API_URL}/reports/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        response = await axios.post(`${API_URL}/reports`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Generate PDF locally
      await generateReportPDF(response.data);
      
      navigate('/reports');
    } catch (error: any) {
      console.error("Erreur complète :", error);
      alert("Une erreur est survenue lors de l'enregistrement du rapport : " + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-32 sm:pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 sm:mb-8">
        <button onClick={() => navigate(-1)} className="self-start sm:self-auto p-2 bg-white rounded-full shadow-sm border border-gray-100 text-gray-500 hover:text-primary-600 transition-colors">
          <ArrowLeft size={24} className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
            {isEditMode ? 'Modifier le Rapport' : 'Nouveau Rapport d\'Intervention'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            {isEditMode ? 'Mettez à jour les informations et les signatures.' : 'Fiche officielle avec 3 blocs de validation (Technicien, Resp. Informatique, Client).'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-500">Chargement des données...</div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Section 1: Informations Générales */}
          <Section title="Informations Générales" step={1}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'intervention *</label>
                <input type="date" {...register('date', { required: true })} className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition-all duration-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type d'intervention *</label>
                <select {...register('interventionType', { required: true })} className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition-all duration-200">
                  <option value="">Sélectionner...</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Installation">Installation</option>
                  <option value="Dépannage">Dépannage</option>
                  <option value="Audit">Audit</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début *</label>
                <input type="time" {...register('startTime', { required: true })} className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition-all duration-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fin *</label>
                <input type="time" {...register('endTime', { required: true })} className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition-all duration-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trimestre</label>
                <select {...register('quarter')} className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition-all duration-200">
                  <option value="">Optionnel...</option>
                  <option value="Trimestre 1">Trimestre 1</option>
                  <option value="Trimestre 2">Trimestre 2</option>
                  <option value="Trimestre 3">Trimestre 3</option>
                  <option value="Trimestre 4">Trimestre 4</option>
                </select>
              </div>
            </div>
          </Section>

          {/* Section 2: Entreprise Cliente & Localisation */}
          <Section title="Entreprise Cliente & Département" step={2}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du client *</label>
                <input type="text" {...register('clientName', { required: true })} className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition-all duration-200" placeholder="Ex: Société Générale Bénin" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'agence</label>
                <input type="text" {...register('agencyName')} className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition-all duration-200" placeholder="Ex: Agence Ganhi" />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse complète *</label>
                <input type="text" {...register('clientAddress', { required: true })} className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition-all duration-200" placeholder="Ex: Avenue Clozel, Cotonou" />
              </div>
              
              {/* 12 Départements du Bénin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Département *</label>
                <select 
                  {...register('clientDepartment', { 
                    required: true,
                    onChange: (e) => {
                      setValue('itManagerDepartment', e.target.value);
                      setValue('clientCommune', '');
                    }
                  })} 
                  className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition-all duration-200"
                >
                  <option value="">Sélectionner un département...</option>
                  {BENIN_DEPARTMENTS.map((dept) => (
                    <option key={dept.name} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Communes selon département */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commune</label>
                <select 
                  {...register('clientCommune')} 
                  className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition-all duration-200"
                >
                  <option value="">Sélectionner une commune...</option>
                  {availableCommunes.map((commune) => (
                    <option key={commune} value={commune}>
                      {commune}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Section>

          {/* Section 3: Équipe Technique */}
          <Section title="Équipe Technique" step={3}>
            <div className="space-y-4">
              {fields.map((item, index) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-end gap-3 sm:space-x-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100/50">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet du technicien</label>
                    <input type="text" {...register(`technicians.${index}.fullName` as const, { required: true })} className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Jean Dupont" />
                  </div>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={24} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => append({ fullName: '', techId: '' })} className="flex items-center text-primary-600 font-medium hover:text-primary-700 bg-primary-50 px-4 py-2 rounded-lg">
                <Plus size={20} className="mr-2" /> Ajouter un technicien
              </button>
            </div>
          </Section>

          {/* Section 4: Présence sur Site */}
          <Section title="Présence sur Site (Photos)" step={4}>
            <PhotoUploader onPhotosChange={setPhotos} maxPhotos={10} />
          </Section>

          {/* Section 5: Situation Avant Intervention */}
          <Section title="Situation Avant Intervention" step={5}>
            <PhotoUploader onPhotosChange={setPhotosBefore} maxPhotos={5} />
          </Section>

          {/* Section 6: Problématiques Rencontrées */}
          <Section title="Problématiques Rencontrées" step={6}>
            <textarea {...register('problemsEncountered')} rows={4} className="w-full p-4 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition-all duration-200" placeholder="Ex: Panne réseau, switch non alimenté ou matériel défectueux..."></textarea>
          </Section>

          {/* Section 7: Situation Après Intervention */}
          <Section title="Situation Après Intervention" step={7}>
            <PhotoUploader onPhotosChange={setPhotosAfter} maxPhotos={5} />
          </Section>

          {/* Section 8: Solution Apportée */}
          <Section title="Solution Apportée" step={8}>
            <textarea {...register('solutionProvided')} rows={5} className="w-full p-4 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition-all duration-200" placeholder="Ex: Remplacement du câble RJ45, configuration du routeur et tests de connectivité OK..."></textarea>
          </Section>

          {/* Section 9: Remarques et Observations */}
          <Section title="Remarques et Observations" step={9}>
            <textarea {...register('remarks')} rows={3} className="w-full p-4 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition-all duration-200" placeholder="Ex: RAS ou prévoir maintenance préventive dans 3 mois..."></textarea>
          </Section>

          {/* ======================================================== */}
          {/* SECTION 10 : VISA & SIGNATURE TECHNICIEN REGO */}
          {/* ======================================================== */}
          <Section title="1. Visa & Signature Technicien REGO" step={10}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Technicien Signataire *</label>
              <input 
                type="text" 
                {...register('technicianName', { required: true })} 
                className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition-all duration-200" 
                placeholder="Nom du technicien certifié"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Signature du Technicien</label>
              <SignaturePad onSave={setTechnicianSignature} />
            </div>
          </Section>

          {/* ======================================================== */}
          {/* SECTION 11 : VISA & SIGNATURE RESPONSABLE INFORMATIQUE */}
          {/* ======================================================== */}
          <Section title="2. Visa & Signature Responsable Informatique" step={11}>
            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Validation par le Responsable Informatique</h4>
                  <p className="text-xs text-gray-600">
                    Département d'intervention : <span className="font-bold text-blue-700">{selectedDepartment}</span>
                  </p>
                </div>
              </div>

              {/* Choix Mode : Sur place vs En ligne */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setItSignOnSite(true)}
                  className={`p-3.5 rounded-xl border text-left font-medium text-sm flex items-center space-x-3 transition-all ${
                    itSignOnSite 
                      ? 'bg-white border-blue-500 text-blue-900 shadow-sm ring-2 ring-blue-500/20' 
                      : 'bg-white/60 border-gray-200 text-gray-600 hover:bg-white'
                  }`}
                >
                  <CheckCircle2 size={18} className={itSignOnSite ? 'text-blue-600' : 'text-gray-400'} />
                  <div>
                    <p className="font-bold">Signer sur place maintenant</p>
                    <p className="text-xs text-gray-500 font-normal">Le Responsable Info est présent sur place</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setItSignOnSite(false)}
                  className={`p-3.5 rounded-xl border text-left font-medium text-sm flex items-center space-x-3 transition-all ${
                    !itSignOnSite 
                      ? 'bg-white border-amber-500 text-amber-900 shadow-sm ring-2 ring-amber-500/20' 
                      : 'bg-white/60 border-gray-200 text-gray-600 hover:bg-white'
                  }`}
                >
                  <Clock size={18} className={!itSignOnSite ? 'text-amber-600' : 'text-gray-400'} />
                  <div>
                    <p className="font-bold">Signature en ligne à distance</p>
                    <p className="text-xs text-gray-500 font-normal">Il se connectera sur son espace pour signer</p>
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Nom du Responsable Informatique
                  </label>
                  <input
                    type="text"
                    {...register('itManagerName')}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: M. Robert KOUASSI"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Département
                  </label>
                  <select
                    {...register('itManagerDepartment')}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {BENIN_DEPARTMENTS.map((dept) => (
                      <option key={dept.name} value={dept.name}>
                        Département {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {itSignOnSite ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signature tactile du Responsable Informatique (sur l'appareil)
                </label>
                <SignaturePad onSave={setItManagerSignature} />
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-amber-800 text-sm">
                <Clock size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Rapport en attente de visa électronique</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Le rapport sera enregistré avec le statut <strong>« En attente de signature »</strong>. 
                    Le Responsable Informatique du département <strong>{selectedDepartment}</strong> pourra se connecter depuis son appareil pour valider et signer en ligne. Le PDF final complet sera ensuite disponible pour impression.
                  </p>
                </div>
              </div>
            )}
          </Section>

          {/* ======================================================== */}
          {/* SECTION 12 : VALIDATION CLIENT (BÉNÉFICIAIRE) */}
          {/* ======================================================== */}
          <Section title="3. Validation Client Bénéficiaire" step={12}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du représentant client *</label>
                <input type="text" {...register('clientRepresentative', { required: true })} className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition-all duration-200" placeholder="Ex: Paul MENSAH" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fonction *</label>
                <input type="text" {...register('representativeRole', { required: true })} className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition-all duration-200" placeholder="Ex: Directeur d'Agence / Responsable Opérations" />
              </div>
            </div>
            
            <label className="block text-sm font-medium text-gray-700 mb-2">Signature du Représentant Client</label>
            <SignaturePad onSave={setClientSignature} />
          </Section>

          {/* Submit Toolbar */}
          <div className="fixed bottom-[68px] md:bottom-0 left-0 right-0 w-full bg-white py-3 sm:py-4 px-4 md:px-12 lg:px-24 xl:px-48 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] border-t border-gray-200 z-40 flex justify-between sm:justify-end items-center sm:space-x-4">
            <button type="button" onClick={() => navigate('/')} className="px-4 sm:px-6 py-2.5 sm:py-3 font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base hidden sm:block">
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full sm:w-auto flex justify-center items-center px-6 sm:px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              <Save size={20} className="mr-2 hidden sm:block" />
              {isSubmitting 
                ? 'Enregistrement...' 
                : itSignOnSite && itManagerSignature
                  ? 'Valider et Générer le PDF (3 Signatures)'
                  : 'Enregistrer & Mettre en attente (Resp. Info)'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
