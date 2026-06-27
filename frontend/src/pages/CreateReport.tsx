import { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import SignaturePad from '../components/SignaturePad';
import PhotoUploader from '../components/PhotoUploader';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { generateReportPDF } from '../utils/pdfGenerator';

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
  technicians: { fullName: string; techId: string }[];
  problemsEncountered: string;
  situationBefore: string;
  solutionProvided: string;
  situationAfter: string;
  remarks: string;
  clientRepresentative: string;
  representativeRole: string;
};

const Section = ({ title, children, step }: { title: string, children: React.ReactNode, step: number }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center space-x-3">
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

  const [signature, setSignature] = useState<string | null>(null);
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
          // Scale down if too large to save space and prevent crashes
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
            // Fill white background in case of transparent PNG
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            // Output as JPEG
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

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      technicians: [{ fullName: '', techId: '' }],
      date: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '17:00'
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'technicians'
  });

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
          
          // Reset form with existing data
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
            clientDepartment: data.clientDepartment,
            technicians: data.technicians?.length > 0 ? data.technicians : [{ fullName: '', techId: '' }],
            problemsEncountered: data.problemsEncountered || '',
            solutionProvided: data.solutionProvided || '',
            remarks: data.remarks || '',
            clientRepresentative: data.clientRepresentative || '',
            representativeRole: data.representativeRole || ''
          });
          
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

      const payload = {
        ...data,
        technicians: data.technicians.map((t, index) => ({
          fullName: t.fullName,
          techId: t.techId || `TECH-${Date.now().toString().slice(-4)}${index}`
        })),
        duration: calculateDuration(),
      };

      // Only include photos if new ones were uploaded
      if (base64Before.length > 0) payload.situationBefore = JSON.stringify(base64Before);
      if (base64After.length > 0) payload.situationAfter = JSON.stringify(base64After);
      if (base64Presence.length > 0) payload.presencePhotos = JSON.stringify(base64Presence);
      if (signature) payload.clientSignature = signature;

      console.log("Données envoyées :", {
        ...payload,
        situationBefore: payload.situationBefore ? "PRESENT" : "EMPTY",
        situationAfter: payload.situationAfter ? "PRESENT" : "EMPTY",
        presencePhotos: payload.presencePhotos ? "PRESENT" : "EMPTY",
        clientSignature: payload.clientSignature ? payload.clientSignature.substring(0, 50) + "..." : "EMPTY"
      });

      const token = localStorage.getItem('token');
      
      let response;
      if (isEditMode) {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        response = await axios.put(`${API_URL}/reports/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        response = await axios.post(`${API_URL}/reports`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      console.log("Réponse API :", response);

      // Generate PDF locally
      await generateReportPDF(response.data);
      
      navigate('/reports');
    } catch (error: any) {
      console.error("Erreur complète :", error);
      console.error(error.response);
      console.error("Erreur backend :", error.response?.data);
      alert("Une erreur est survenue lors de l'enregistrement du rapport : " + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-primary-600 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">{isEditMode ? 'Modifier le Rapport' : 'Nouveau Rapport d\'Intervention'}</h1>
          <p className="text-gray-500 mt-1">{isEditMode ? 'Mettez à jour les informations du rapport.' : 'Veuillez remplir toutes les sections obligatoires.'}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-500">Chargement des données...</div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
        {/* Section 1: Informations Générales */}
        <Section title="Informations Générales" step={1}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'intervention *</label>
              <input type="date" {...register('date', { required: true })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type d'intervention *</label>
              <select {...register('interventionType', { required: true })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
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
              <input type="time" {...register('startTime', { required: true })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fin *</label>
              <input type="time" {...register('endTime', { required: true })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="md:col-span-2 grid grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Durée (calculée)</label>
                <div className="p-3 bg-white border border-gray-200 rounded-lg text-gray-600 font-medium">{calculateDuration()} h</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prix (€)</label>
                <input type="number" step="0.01" {...register('price')} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trimestre</label>
                <select {...register('quarter')} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                  <option value="">Optionnel...</option>
                  <option value="T1">T1</option>
                  <option value="T2">T2</option>
                  <option value="T3">T3</option>
                  <option value="T4">T4</option>
                </select>
              </div>
            </div>
          </div>
        </Section>

        {/* Section 2: Entreprise Cliente */}
        <Section title="Entreprise Cliente" step={2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du client *</label>
              <input type="text" {...register('clientName', { required: true })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Ex: Société Générale" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'agence</label>
              <input type="text" {...register('agencyName')} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Ex: Agence Paris Centre" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse complète *</label>
              <input type="text" {...register('clientAddress', { required: true })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="123 rue de la République..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Département *</label>
              <input type="text" {...register('clientDepartment', { required: true })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Ex: 75 - Paris" />
            </div>
          </div>
        </Section>

        {/* Section 3: Équipe Technique */}
        <Section title="Équipe Technique" step={3}>
          <div className="space-y-4">
            {fields.map((item, index) => (
              <div key={item.id} className="flex items-end space-x-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
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

        <Section title="Situation Avant Intervention" step={5}>
          <PhotoUploader onPhotosChange={setPhotosBefore} maxPhotos={5} />
        </Section>

        <Section title="Problématiques Rencontrées" step={6}>
          <textarea {...register('problemsEncountered')} rows={4} className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Ex: Aucun problème rencontré ou Défaillance du matériel constatée..."></textarea>
        </Section>

        <Section title="Situation Après Intervention" step={7}>
          <PhotoUploader onPhotosChange={setPhotosAfter} maxPhotos={5} />
        </Section>

        <Section title="Solution Apportée" step={8}>
          <textarea {...register('solutionProvided')} rows={5} className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Ex: Remplacement de la télévision et démobilisation de l'ancienne TV..."></textarea>
        </Section>

        <Section title="Remarques et Observations" step={9}>
          <textarea {...register('remarks')} rows={3} className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Ex: RAS ou prévoir maintenance dans 6 mois..."></textarea>
        </Section>

        {/* Section 10: Validation Client */}
        <Section title="Validation Client" step={10}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du représentant client *</label>
              <input type="text" {...register('clientRepresentative', { required: true })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fonction *</label>
              <input type="text" {...register('representativeRole', { required: true })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          
          <SignaturePad onSave={setSignature} />
        </Section>

        {/* Submit */}
        <div className="fixed bottom-0 left-0 right-0 w-full bg-white py-4 px-6 md:px-12 lg:px-24 xl:px-48 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] border-t border-gray-200 z-50 flex justify-end items-center space-x-4">
          <button type="button" onClick={() => navigate('/')} className="px-6 py-3 font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            Annuler
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Save size={20} className="mr-2" />
            {isSubmitting ? 'Enregistrement...' : (isEditMode ? 'Mettre à jour et Générer PDF' : 'Valider et Générer PDF')}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
