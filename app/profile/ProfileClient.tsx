'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User, Mail, Calendar, Database, FileText, CreditCard, Repeat, TrendingUp } from 'lucide-react';

type UserStats = {
  transactions: number;
  budgets: number;
  debts: number;
  recurringCharges: number;
};

export default function ProfileClient() {
  const [email, setEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<string>('');
  const [stats, setStats] = useState<UserStats>({
    transactions: 0,
    budgets: 0,
    debts: 0,
    recurringCharges: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user info
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setEmail(user.email || '');
          setUserId(user.id);
          setCreatedAt(user.created_at);

          // Fetch user statistics
          const [txCount, budgetCount, debtCount, rcCount] = await Promise.all([
            supabase.from('transactions').select('id', { count: 'exact', head: true }),
            supabase.from('budgets').select('id', { count: 'exact', head: true }),
            supabase.from('debts').select('id', { count: 'exact', head: true }),
            supabase.from('recurring_charges').select('id', { count: 'exact', head: true }),
          ]);

          setStats({
            transactions: txCount.count || 0,
            budgets: budgetCount.count || 0,
            debts: debtCount.count || 0,
            recurringCharges: rcCount.count || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Information Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Informations du Compte
        </h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Email</p>
              <p className="text-gray-900">{email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">User ID</p>
              <p className="text-xs text-gray-600 font-mono break-all">{userId}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Compte créé le</p>
              <p className="text-gray-900">
                {new Date(createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Mes Statistiques
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-blue-900">{stats.transactions}</p>
              <p className="text-sm text-blue-700">Transactions</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-900">{stats.budgets}</p>
              <p className="text-sm text-green-700">Budgets</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
            <CreditCard className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-orange-900">{stats.debts}</p>
              <p className="text-sm text-orange-700">Dettes</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
            <Repeat className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-900">{stats.recurringCharges}</p>
              <p className="text-sm text-purple-700">Charges Récurrentes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">🔒 Sécurité & Confidentialité</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Vos données sont protégées par Row Level Security (RLS)</li>
          <li>• Aucun autre utilisateur ne peut accéder à vos informations</li>
          <li>• Toutes les actions sont auditées et traçables</li>
          <li>• Connexions sécurisées avec authentification Supabase</li>
        </ul>
      </div>

      {/* Multi-Tenant Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-900 mb-2">✨ Mode Multi-Utilisateur</h3>
        <p className="text-sm text-green-800">
          Cette application supporte plusieurs utilisateurs. Chaque compte a ses propres données
          complètement isolées. Vous pouvez inviter d'autres personnes à créer leur propre compte
          en leur partageant le lien d'inscription.
        </p>
      </div>
    </div>
  );
}
