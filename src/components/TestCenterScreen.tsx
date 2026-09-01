import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { QASecurityService, TestResult } from '../core/services/qaSecurityService';
import { BackupService } from '../core/services/backupService';
import { 
  ShieldCheck, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Download, 
  Upload, 
  Database, 
  Code2, 
  Smartphone, 
  Lock, 
  Zap, 
  FileText, 
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter
} from 'lucide-react';

export const TestCenterScreen: React.FC = () => {
  const context = useApp();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'SUITE' | 'BACKUPS' | 'SQL_SCHEMA' | 'MOBILE_SIMULATOR'>('SUITE');
  const [copiedSql, setCopiedSql] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  // Ejecutar suite al cargar
  useEffect(() => {
    runSuite();
  }, [context.currentOrg, context.currentUser]);

  const runSuite = async () => {
    setIsRunningAll(true);
    try {
      const results = await QASecurityService.runAllTests({
        organizations: context.organizations,
        currentOrg: context.currentOrg,
        products: context.products,
        orders: context.orders,
        customers: context.customers,
        subscriptions: context.subscriptions,
        plans: context.plans,
        currentRole: context.currentRole,
        currentUser: context.currentUser,
      });
      setTests(results);
    } finally {
      setIsRunningAll(false);
    }
  };

  const passedCount = tests.filter(t => t.status === 'PASSED').length;
  const warningCount = tests.filter(t => t.status === 'WARNING').length;
  const failedCount = tests.filter(t => t.status === 'FAILED').length;

  const filteredTests = filterCategory === 'ALL'
    ? tests
    : tests.filter(t => t.category === filterCategory);

  const handleDownloadBackup = () => {
    BackupService.createAndDownloadBackup({
      organizations: context.organizations,
      products: context.products,
      categories: context.categories,
      services: context.services,
      customers: context.customers,
      orders: context.orders,
      appointments: context.appointments,
      gallery: context.galleryItems,
      subscriptions: context.subscriptions,
      paymentTransactions: context.paymentTransactions,
      users: context.systemUsers,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = BackupService.validateBackupFile(content);
      if (validation.valid && validation.data) {
        setRestoreStatus(`✓ Copia de seguridad válida detectada (${validation.data.organizations.length} organizaciones, ${validation.data.products.length} productos).`);
      } else {
        setRestoreStatus(`✕ Error en archivo de respaldo: ${validation.error}`);
      }
    };
    reader.readAsText(file);
  };

  const sampleSqlSnippet = `-- TABLA: ORGANIZATIONS & RLS POLICIES
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active organizations"
  ON public.organizations FOR SELECT
  USING (is_active = TRUE OR public.is_member_of_org(id));

CREATE POLICY "Members can update their organization"
  ON public.organizations FOR UPDATE
  USING (public.is_member_of_org(id));`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleSqlSnippet);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              FASE 12: PRUEBAS & LANZAMIENTO
            </span>
            <span className="text-[10px] font-bold text-slate-400">• 20 Checkpoints de Auditoría</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Centro de Pruebas, Seguridad & Auditoría QA
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Verifica el aislamiento multi-inquilino, reglas RLS, límites de plan, WhatsApp y preparación para producción.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={runSuite}
            disabled={isRunningAll}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRunningAll ? 'animate-spin' : ''}`} />
            <span>{isRunningAll ? 'Ejecutando Suite...' : 'Ejecutar Auditoría Completa'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-slate-200/70 p-1 rounded-2xl gap-1 w-full max-w-2xl text-xs font-bold">
        <button
          onClick={() => setActiveTab('SUITE')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'SUITE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>Suite de 20 Pruebas</span>
        </button>
        <button
          onClick={() => setActiveTab('BACKUPS')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'BACKUPS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>Copias de Seguridad</span>
        </button>
        <button
          onClick={() => setActiveTab('SQL_SCHEMA')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'SQL_SCHEMA' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Code2 className="w-3.5 h-3.5 text-amber-600" />
          <span>Schema SQL & RLS</span>
        </button>
        <button
          onClick={() => setActiveTab('MOBILE_SIMULATOR')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'MOBILE_SIMULATOR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-violet-600" />
          <span>Simulador Móvil</span>
        </button>
      </div>

      {/* Tab 1: Suite de 20 Pruebas */}
      {activeTab === 'SUITE' && (
        <div className="space-y-6">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Checkpoints</span>
              <p className="text-2xl font-black text-slate-900 mt-1">20 / 20</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Aprobadas (Pass)
              </span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{passedCount}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-700 uppercase flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Advertencias
              </span>
              <p className="text-2xl font-black text-amber-700 mt-1">{warningCount}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-2xs">
              <span className="text-[11px] font-bold text-rose-700 uppercase flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-rose-600" /> Fallidas
              </span>
              <p className="text-2xl font-black text-rose-700 mt-1">{failedCount}</p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-bold text-[11px] mr-1">Filtrar:</span>
            {[
              { id: 'ALL', label: 'Todas las 20 Pruebas' },
              { id: 'SECURITY_RLS', label: 'Seguridad & RLS' },
              { id: 'SAAS_LIMITS', label: 'Límites & Suscripción' },
              { id: 'CART_ORDERS', label: 'Pedidos & WhatsApp' },
              { id: 'LAUNCH', label: 'Lanzamiento & Legal' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap ${
                  filterCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Test List Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
            {filteredTests.map(test => (
              <div key={test.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {test.status === 'PASSED' && (
                      <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                    {test.status === 'WARNING' && (
                      <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    )}
                    {test.status === 'FAILED' && (
                      <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                        <XCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900">{test.id}</span>
                      <h4 className="font-bold text-slate-900 text-xs">{test.name.replace(/^[0-9.]+\s*/, '')}</h4>
                      <span className={`text-[10px] font-black px-2 py-0.2 rounded-md ${
                        test.status === 'PASSED' ? 'bg-emerald-100 text-emerald-800' :
                        test.status === 'WARNING' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {test.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">{test.message}</p>
                    
                    {test.details && (
                      <p className="text-[11px] text-slate-400 font-mono mt-1">
                        ↳ {test.details}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 text-[10px] text-slate-400 font-mono">
                  {test.timestamp || 'Verificado'}
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* Tab 2: Copias de Seguridad (FASE 12.15) */}
      {activeTab === 'BACKUPS' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900">Gestión de Copias de Seguridad (Backup & Restore)</h3>
            <p className="text-xs text-slate-500 font-medium">
              Exporta un respaldo completo de la base de datos multiempresa a formato JSON estructurado o restaura un snapshot previo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Export Card */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Descargar Respaldo Completo</h4>
                  <p className="text-xs text-slate-500">Incluye organizaciones, productos, órdenes, clientes y suscripciones.</p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-600 space-y-1">
                <div>• Organizaciones: {context.organizations.length}</div>
                <div>• Productos totales: {context.products.length}</div>
                <div>• Pedidos registrados: {context.orders.length}</div>
                <div>• Clientes CRM: {context.customers.length}</div>
              </div>

              <button
                onClick={handleDownloadBackup}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Snapshot (.json)</span>
              </button>
            </div>

            {/* Import Card */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Restaurar Copia de Seguridad</h4>
                  <p className="text-xs text-slate-500">Carga un archivo de respaldo JSON generado previamente.</p>
                </div>
              </div>

              <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-100/50 transition-colors">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Database className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Arrastra tu archivo JSON o haz clic para examinar</p>
                <p className="text-[10px] text-slate-400 mt-1">Formato: backup_negocio_flex_*.json</p>
              </div>

              {restoreStatus && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800">
                  {restoreStatus}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Tab 3: Schema SQL & RLS */}
      {activeTab === 'SQL_SCHEMA' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Script SQL Unificado & Políticas RLS</h3>
              <p className="text-xs text-slate-500">
                Ubicado en <code className="text-indigo-600 font-mono">/src/core/database/supabase_schema_complete.sql</code>
              </p>
            </div>

            <button
              onClick={copyToClipboard}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copiado' : 'Copiar SQL'}</span>
            </button>
          </div>

          <div className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-96 border border-slate-800">
            <pre>{sampleSqlSnippet}</pre>
          </div>
        </div>
      )}

      {/* Tab 4: Simulador de Dispositivo Móvil en Vivo */}
      {activeTab === 'MOBILE_SIMULATOR' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Simulador de Smartphone en Tiempo Real</h3>
              <p className="text-xs text-slate-500">
                Previsualización exacta de la experiencia del cliente final en un marco móvil responsive (iPhone 16).
              </p>
            </div>
            
            <button
              onClick={() => context.setActiveView('client_catalog')}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Vista Completa</span>
            </button>
          </div>

          <div className="flex justify-center py-4 bg-slate-100 rounded-2xl border border-slate-200">
            <div className="w-[360px] h-[650px] bg-slate-950 rounded-[44px] p-3 border-4 border-slate-800 shadow-2xl relative flex flex-col overflow-hidden">
              
              {/* Top Notch Bar */}
              <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-2 shrink-0" />

              {/* Internal Mock Content */}
              <div className="flex-1 bg-white rounded-[32px] overflow-y-auto p-4 text-slate-900 space-y-4">
                
                {/* Store Banner & Info */}
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                    {context.currentOrg?.name?.slice(0, 2).toUpperCase() || 'NF'}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm leading-tight">{context.currentOrg?.name}</h4>
                    <p className="text-[11px] text-emerald-600 font-bold">● Abierto • Recibe por WhatsApp</p>
                  </div>
                </div>

                {/* Sample Catalog Items */}
                <div className="space-y-2">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                    Catálogo ({context.products.filter(p => p.organization_id === context.currentOrg?.id).length} productos)
                  </span>
                  
                  {context.products.filter(p => p.organization_id === context.currentOrg?.id).slice(0, 4).map(prod => (
                    <div key={prod.id} className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                      <div className="truncate">
                        <p className="font-bold text-xs text-slate-900 truncate">{prod.name}</p>
                        <p className="font-black text-xs text-indigo-600">S/ {prod.price.toFixed(2)}</p>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold shrink-0">
                        + Agregar
                      </span>
                    </div>
                  ))}
                </div>

                {/* Simulated Sticky Cart Pill */}
                <div className="pt-2">
                  <div className="p-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-between shadow-md">
                    <span>Mi Carrito (2 productos)</span>
                    <span>S/ 48.00 ➔</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
};
