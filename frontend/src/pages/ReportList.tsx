import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, Eye, Download, Edit, Trash2, ShieldCheck, Clock, CheckCircle, PenTool, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { generateReportPDF } from '../utils/pdfGenerator';
import SignaturePad from '../components/SignaturePad';
import { BENIN_DEPARTMENTS } from '../constants/locations';

export default function ReportList() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Signing modal state for IT Manager
  const [selectedReportToSign, setSelectedReportToSign] = useState<any | null>(null);
  const [itSignerName, setItSignerName] = useState(user ? `${user.firstName} ${user.lastName}` : '');
  const [itModalSignature, setItModalSignature] = useState<string | null>(null);
  const [isSigningLoading, setIsSigningLoading] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.get(`${API_URL}/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
    } catch (e) {
      console.error("Erreur chargement rapports:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce rapport ?")) return;
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      await axios.delete(`${API_URL}/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchReports();
    } catch (e) {
      console.error("Erreur suppression:", e);
      alert("Erreur lors de la suppression");
    }
  };

  const handleDownload = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.get(`${API_URL}/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await generateReportPDF(response.data);
    } catch (e) {
      console.error("Erreur téléchargement:", e);
      alert("Erreur lors du téléchargement");
    }
  };

  const handleOpenSignModal = (report: any) => {
    setSelectedReportToSign(report);
    setItSignerName(user ? `${user.firstName} ${user.lastName}` : (report.itManagerName || ''));
    setItModalSignature(null);
  };

  const handleConfirmItSignature = async () => {
    if (!selectedReportToSign) return;
    if (!itModalSignature) {
      alert("Veuillez apposer votre signature sur le pad avant de valider.");
      return;
    }

    setIsSigningLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      const response = await axios.post(
        `${API_URL}/reports/${selectedReportToSign.id}/sign-it-manager`,
        {
          itManagerName: itSignerName || `${user?.firstName} ${user?.lastName}`,
          itManagerDepartment: selectedReportToSign.clientDepartment,
          itManagerSignature: itModalSignature
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Close modal
      setSelectedReportToSign(null);
      // Refresh list
      await fetchReports();

      // Propose download
      if (window.confirm("Rapport validé et signé avec succès ! Voulez-vous générer et télécharger le PDF prêt à l'impression maintenant ?")) {
        await generateReportPDF(response.data);
      }
    } catch (err: any) {
      console.error("Erreur lors de la signature:", err);
      alert(err.response?.data?.message || "Erreur lors de l'enregistrement de la signature");
    } finally {
      setIsSigningLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      report.reportNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.clientDepartment?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType ? report.interventionType === filterType : true;
    const matchesDept = filterDepartment ? report.clientDepartment?.toLowerCase() === filterDepartment.toLowerCase() : true;
    
    let matchesStatus = true;
    if (filterStatus === 'VALIDE') {
      matchesStatus = report.status === 'VALIDE' || Boolean(report.itManagerSignature);
    } else if (filterStatus === 'EN_ATTENTE_SIGNATURE') {
      matchesStatus = report.status !== 'VALIDE' && !report.itManagerSignature;
    }

    return matchesSearch && matchesType && matchesDept && matchesStatus;
  });

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Rapports d'Intervention</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Gérez, vérifiez, signez en ligne et imprimez vos rapports.
          </p>
        </div>
        
        {user?.role !== 'RESPONSABLE_INFO' && (
          <Link to="/reports/new" className="bg-primary-600 hover:bg-primary-700 text-white px-5 sm:px-6 py-2.5 sm:py-2 rounded-lg shadow-md font-medium transition-colors text-center text-sm sm:text-base">
            Nouveau Rapport
          </Link>
        )}
      </div>

      {/* Role Notice Banner */}
      {user?.role === 'RESPONSABLE_INFO' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-bold text-blue-950 text-sm sm:text-base">
                Espace Responsable Informatique — Département {user.department || 'Non spécifié'}
              </h3>
              <p className="text-xs sm:text-sm text-blue-800/80">
                Vous avez la main pour examiner et signer électroniquement les rapports d'intervention de votre département avant impression.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 sm:gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm sm:text-base"
            placeholder="Rechercher (client, n°, département)..."
          />
        </div>

        {/* Filter Type */}
        <div className="w-full md:w-48 relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm sm:text-base bg-white"
          >
            <option value="">Tous les types</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Installation">Installation</option>
            <option value="Dépannage">Dépannage</option>
            <option value="Audit">Audit</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        {/* Filter Department */}
        {user?.role !== 'RESPONSABLE_INFO' && (
          <div className="w-full md:w-48 relative">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="block w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm sm:text-base bg-white"
            >
              <option value="">Tous départements</option>
              {BENIN_DEPARTMENTS.map(d => (
                <option key={d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Filter Status */}
        <div className="w-full md:w-48 relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm sm:text-base bg-white"
          >
            <option value="">Tous les statuts</option>
            <option value="VALIDE">Validé (3 Signatures)</option>
            <option value="EN_ATTENTE_SIGNATURE">En attente Resp. Info</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
        <div className="overflow-x-auto w-full pb-2">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs sm:text-sm uppercase tracking-wider">
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap">N° Rapport</th>
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap">Date</th>
                <th className="p-3 sm:p-4 font-semibold">Client</th>
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap">Département</th>
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap">Statut Visa</th>
                <th className="p-3 sm:p-4 font-semibold text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="p-6 sm:p-8 text-center text-gray-500 text-sm">Chargement des rapports...</td></tr>
              ) : filteredReports.length === 0 ? (
                <tr><td colSpan={6} className="p-6 sm:p-8 text-center text-gray-500 text-sm">Aucun rapport trouvé.</td></tr>
              ) : (
                filteredReports.map(report => {
                  const isValidated = report.status === 'VALIDE' || Boolean(report.itManagerSignature);

                  return (
                    <tr key={report.id} className="hover:bg-gray-50/80 transition-colors text-sm sm:text-base">
                      <td className="p-3 sm:p-4 font-medium text-gray-900 whitespace-nowrap">
                        {report.reportNumber}
                      </td>
                      <td className="p-3 sm:p-4 text-gray-600 whitespace-nowrap">
                        {new Date(report.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="p-3 sm:p-4 text-gray-900 min-w-[150px]">
                        <span className="font-semibold">{report.clientName}</span>
                        {report.agencyName && <p className="text-xs text-gray-500">{report.agencyName}</p>}
                      </td>
                      <td className="p-3 sm:p-4 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                          {report.clientDepartment} {report.clientCommune ? `(${report.clientCommune})` : ''}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 whitespace-nowrap">
                        {isValidated ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center">
                            <CheckCircle size={14} className="mr-1 text-emerald-600" /> Validé (Complet)
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200/60 px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center">
                            <Clock size={14} className="mr-1 text-amber-600" /> En attente visa Info
                          </span>
                        )}
                      </td>
                      <td className="p-3 sm:p-4 flex justify-end items-center space-x-2">
                        {/* Sign Button for IT Manager or if not yet signed */}
                        {!isValidated && (
                          <button 
                            onClick={() => handleOpenSignModal(report)} 
                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                            title="Signer en ligne"
                          >
                            <PenTool size={14} />
                            <span>Signer</span>
                          </button>
                        )}

                        <button onClick={() => handleDownload(report.id)} className="p-2 text-gray-500 hover:text-emerald-700 bg-white border border-gray-200 rounded-lg shadow-sm transition-colors" title="Télécharger / Imprimer PDF">
                          <Download size={18} className="sm:w-4 sm:h-4" />
                        </button>
                        
                        {user?.role !== 'RESPONSABLE_INFO' && (
                          <button onClick={() => navigate(`/reports/edit/${report.id}`)} className="p-2 text-gray-500 hover:text-blue-600 bg-white border border-gray-200 rounded-lg shadow-sm transition-colors" title="Modifier">
                            <Edit size={18} className="sm:w-4 sm:h-4" />
                          </button>
                        )}

                        {user?.role === 'ADMIN' && (
                          <button onClick={() => handleDelete(report.id)} className="p-2 text-gray-500 hover:text-red-600 bg-white border border-gray-200 rounded-lg shadow-sm transition-colors" title="Supprimer">
                            <Trash2 size={18} className="sm:w-4 sm:h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODALE DE SIGNATURE EN LIGNE DU RESPONSABLE INFORMATIQUE */}
      {/* ======================================================== */}
      {selectedReportToSign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-gray-100">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Visa & Signature en Ligne</h3>
                  <p className="text-xs text-gray-500">
                    Rapport N° <span className="font-bold text-blue-700">{selectedReportToSign.reportNumber}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReportToSign(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Report Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl mb-6 text-sm space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Client :</span>
                <span className="font-bold text-gray-900">{selectedReportToSign.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Département :</span>
                <span className="font-semibold text-blue-700">{selectedReportToSign.clientDepartment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Intervention :</span>
                <span className="font-semibold text-gray-900">{selectedReportToSign.interventionType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date :</span>
                <span className="text-gray-900">{new Date(selectedReportToSign.date).toLocaleDateString('fr-FR')}</span>
              </div>
              {selectedReportToSign.problemsEncountered && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-xs font-semibold text-gray-600 block mb-0.5">Constat :</span>
                  <p className="text-xs text-gray-800 italic">{selectedReportToSign.problemsEncountered}</p>
                </div>
              )}
            </div>

            {/* Signer inputs */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nom complet du Responsable Informatique *
                </label>
                <input
                  type="text"
                  value={itSignerName}
                  onChange={(e) => setItSignerName(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  placeholder="Ex: M. Robert KOUASSI"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Votre Signature Tactique / Électronique *
                </label>
                <SignaturePad onSave={setItModalSignature} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedReportToSign(null)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmItSignature}
                disabled={isSigningLoading || !itModalSignature}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all text-sm flex items-center space-x-2"
              >
                <PenTool size={16} />
                <span>{isSigningLoading ? 'Enregistrement...' : 'Valider & Apposer ma signature'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
