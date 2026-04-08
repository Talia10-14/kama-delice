"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, XCircle, BarChart3, Shield } from "lucide-react";

interface SecurityAudit {
  httpsActive: boolean;
  headersPresent: boolean;
  failedLoginsLast24h: number;
  unusualLoginAttempts: {
    userId: string;
    email: string;
    ipAddress: string;
    time: string;
  }[];
  inactiveAccounts: {
    userId: string;
    email: string;
    lastLogin: string;
  }[];
  passwordsNeverChanged: {
    userId: string;
    email: string;
    createdAt: string;
  }[];
  dataExportsThisWeek: {
    userId: string;
    type: string;
    timestamp: string;
    lineCount: number;
  }[];
}

export default function SecurityPage() {
  const [audit, setAudit] = useState<SecurityAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSecurityAudit();
  }, []);

  const fetchSecurityAudit = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/security-audit", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Impossível de charger l'audit de sécurité");
      }

      const data = await response.json();
      setAudit(data.data);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la récupération";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || "Erreur lors du chargement de l'audit"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-8 h-8 text-blue-600" />
          Audit de Sécurité
        </h1>
        <p className="text-gray-600 mt-2">
          Vérification en temps réel des configurations de sécurité
        </p>
      </div>

      {/* Infrastructure Security */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Infrastructure
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* HTTPS */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            {audit.httpsActive ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            <div>
              <p className="font-semibold">HTTPS</p>
              <p className="text-sm text-gray-600">
                {audit.httpsActive
                  ? "HTTPS actif"
                  : "HTTPS non actif (développement?)"}
              </p>
            </div>
          </div>

          {/* Security Headers */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            {audit.headersPresent ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            <div>
              <p className="font-semibold">Headers de Sécurité</p>
              <p className="text-sm text-gray-600">
                {audit.headersPresent
                  ? "Tous les headers présents"
                  : "Headers manquants"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Login Security */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Sécurité des Connexions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Failed Logins */}
          <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            <div>
              <p className="font-semibold">Échecslast 24h</p>
              <p className="text-2xl font-bold text-orange-600">
                {audit.failedLoginsLast24h}
              </p>
            </div>
          </div>

          {/* Unusual Activity */}
          <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="font-semibold">Activités Inhabituelles</p>
              <p className="text-2xl font-bold text-yellow-600">
                {audit.unusualLoginAttempts.length}
              </p>
            </div>
          </div>
        </div>

        {/* Unusual Login Attempts */}
        {audit.unusualLoginAttempts.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Tentatives inhabituelles</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {audit.unusualLoginAttempts.map((attempt, i) => (
                <div
                  key={i}
                  className="text-sm p-2 bg-yellow-50 rounded border border-yellow-200"
                >
                  <p>
                    <strong>{attempt.email}</strong> depuis{" "}
                    <code className="bg-yellow-100 px-1 rounded">
                      {attempt.ipAddress}
                    </code>
                  </p>
                  <p className="text-gray-600 text-xs">{attempt.time}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Account Status */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4">État des Comptes</h2>

        {/* Inactive Accounts */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            Comptes sans connexion depuis 90 jours ({audit.inactiveAccounts.length})
          </h3>
          {audit.inactiveAccounts.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {audit.inactiveAccounts.map((account, i) => (
                <div
                  key={i}
                  className="text-sm p-2 bg-red-50 rounded border border-red-200 flex justify-between"
                >
                  <span>
                    <strong>{account.email}</strong>
                  </span>
                  <span className="text-gray-600">
                    {new Date(account.lastLogin).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-green-600 text-sm">Aucun compte inactif</p>
          )}
        </div>

        {/* Passwords Never Changed */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            Mots de passe jamais changés depuis {'>'}6 mois (
              {audit.passwordsNeverChanged.length})
          </h3>
          {audit.passwordsNeverChanged.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {audit.passwordsNeverChanged.map((account, i) => (
                <div
                  key={i}
                  className="text-sm p-2 bg-orange-50 rounded border border-orange-200 flex justify-between"
                >
                  <span>
                    <strong>{account.email}</strong>
                  </span>
                  <span className="text-gray-600">
                    Depuis{" "}
                    {new Date(account.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-green-600 text-sm">
              Tous les mots de passe ont été changés récemment
            </p>
          )}
        </div>
      </div>

      {/* Data Access */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4">Accès aux Données</h2>

        <h3 className="font-semibold mb-2">
          Exports de données cette semaine ({audit.dataExportsThisWeek.length})
        </h3>
        {audit.dataExportsThisWeek.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {audit.dataExportsThisWeek.map((exp, i) => (
              <div
                key={i}
                className="text-sm p-2 bg-blue-50 rounded border border-blue-200"
              >
                <p>
                  <strong>{exp.type}</strong> - {exp.lineCount} lignes
                </p>
                <p className="text-gray-600 text-xs">
                  Par: {exp.userId} - {new Date(exp.timestamp).toLocaleString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-green-600 text-sm">Aucun export cette semaine</p>
        )}
      </div>

      {/* Refresh Button */}
      <button
        onClick={fetchSecurityAudit}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Rafraîchir l'audit
      </button>
    </div>
  );
}
