import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, Eye, Download, Edit, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { generateReportPDF } from '../utils/pdfGenerator';

export default function ReportList() {
  const [reports, setReports] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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

  const handleView = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.get(`${API_URL}/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Génère le PDF et l'ouvre au lieu de le télécharger (si supporté, ou le télécharge sinon)
      await generateReportPDF(response.data);
    } catch (e) {
      console.error("Erreur consultation:", e);
      alert("Erreur lors de la consultation");
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          report.reportNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType ? report.interventionType === filterType : true;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Rapports</h1>
          <p className="text-gray-500 mt-1">Gérez et consultez l'historique de vos interventions.</p>
        </div>
        <Link to="/reports/new" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg shadow-md font-medium transition-colors">
          Nouveau Rapport
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            placeholder="Rechercher par client ou numéro..."
          />
        </div>
        <div className="w-full md:w-64 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Filter size={20} />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            <option value="">Tous les types</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Installation">Installation</option>
            <option value="Dépannage">Dépannage</option>
            <option value="Audit">Audit</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="p-4 font-medium">N° Rapport</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Client</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Chargement...</td></tr>
              ) : filteredReports.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Aucun rapport trouvé.</td></tr>
              ) : (
                filteredReports.map(report => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{report.reportNumber}</td>
                    <td className="p-4 text-gray-600">{new Date(report.date).toLocaleDateString('fr-FR')}</td>
                    <td className="p-4 text-gray-900">{report.clientName}</td>
                    <td className="p-4 text-gray-600">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                        {report.interventionType}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        report.status === 'Validé' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="p-4 flex justify-end space-x-2">
                      <button onClick={() => handleView(report.id)} className="p-2 text-gray-400 hover:text-primary-600 bg-white border border-gray-200 rounded shadow-sm transition-colors" title="Consulter">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleDownload(report.id)} className="p-2 text-gray-400 hover:text-green-600 bg-white border border-gray-200 rounded shadow-sm transition-colors" title="Télécharger PDF">
                        <Download size={16} />
                      </button>
                      <button onClick={() => navigate(`/reports/edit/${report.id}`)} className="p-2 text-gray-400 hover:text-blue-600 bg-white border border-gray-200 rounded shadow-sm transition-colors" title="Modifier">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(report.id)} className="p-2 text-gray-400 hover:text-red-600 bg-white border border-gray-200 rounded shadow-sm transition-colors" title="Supprimer">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
