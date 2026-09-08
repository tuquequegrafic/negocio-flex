import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Zero Trust Security Audit & Schema Verification (Phase 8)', () => {
  const phase8Sql = fs.readFileSync(
    path.resolve(__dirname, '../src/core/database/phase8_crm_and_customers.sql'),
    'utf-8'
  );
  const productionSql = fs.readFileSync(
    path.resolve(__dirname, '../src/core/database/supabase_schema_production.sql'),
    'utf-8'
  );
  const completeSql = fs.readFileSync(
    path.resolve(__dirname, '../src/core/database/supabase_schema_complete.sql'),
    'utf-8'
  );

  describe('CRIT-01: DDL Schema Consistency (last_order_number)', () => {
    it('debe contener la columna last_order_number en phase8_crm_and_customers.sql', () => {
      expect(phase8Sql).toMatch(/ALTER TABLE public\.customers ADD COLUMN IF NOT EXISTS last_order_number TEXT DEFAULT NULL/i);
    });

    it('debe contener la columna last_order_number en supabase_schema_production.sql', () => {
      expect(productionSql).toMatch(/last_order_number TEXT DEFAULT NULL/i);
    });

    it('debe contener la columna last_order_number en supabase_schema_complete.sql', () => {
      expect(completeSql).toMatch(/last_order_number TEXT DEFAULT NULL/i);
    });
  });

  describe('CRIT-02: Zero Data Leakage in capture_public_customer', () => {
    it('no debe retornar to_jsonb(v_customer) en phase8_crm_and_customers.sql', () => {
      expect(phase8Sql).not.toContain('RETURN to_jsonb(v_customer);');
    });

    it('debe retornar únicamente payload mínimo sanitizado (id, organization_id, name, phone) en phase8_crm_and_customers.sql', () => {
      expect(phase8Sql).toMatch(/jsonb_build_object\s*\(\s*'id',\s*v_customer\.id,\s*'organization_id',\s*v_customer\.organization_id,\s*'name',\s*v_customer\.name,\s*'phone',\s*v_customer\.phone\s*\)/);
    });

    it('debe retornar únicamente payload mínimo sanitizado en supabase_schema_production.sql', () => {
      expect(productionSql).not.toContain('RETURN to_jsonb(v_customer);');
      expect(productionSql).toMatch(/jsonb_build_object\s*\(\s*'id',\s*v_customer\.id,\s*'organization_id',\s*v_customer\.organization_id,\s*'name',\s*v_customer\.name,\s*'phone',\s*v_customer\.phone\s*\)/);
    });
  });

  describe('CRIT-03: Zero-Trust RLS Policies on public.customers', () => {
    it('no debe permitir UPDATE directo a usuarios anónimos en producción', () => {
      // Verificar que la política de UPDATE en supabase_schema_production no contenga EXISTS(organizations) sin rol
      const updatePolicyRegex = /CREATE POLICY "Customers update policy"[\s\S]*?WITH CHECK/i;
      const match = productionSql.match(updatePolicyRegex);
      expect(match).toBeTruthy();
      if (match) {
        expect(match[0]).toContain("public.get_user_org_role(organization_id) IN ('owner', 'admin', 'staff', 'super_admin')");
        expect(match[0]).not.toContain('auth.uid() IS NULL');
      }
    });

    it('no debe permitir INSERT directo a usuarios anónimos en producción', () => {
      const insertPolicyRegex = /CREATE POLICY "Customers insert policy"[\s\S]*?WITH CHECK\s*\(([\s\S]*?)\);/i;
      const match = productionSql.match(insertPolicyRegex);
      expect(match).toBeTruthy();
      if (match) {
        expect(match[1]).toContain("public.get_user_org_role(organization_id) IN ('owner', 'admin', 'staff', 'super_admin')");
        expect(match[1]).not.toContain('auth.uid() IS NULL');
      }
    });

    it('debe requerir roles administrativos para DELETE en producción', () => {
      const deletePolicyRegex = /CREATE POLICY "Customers delete policy"[\s\S]*?USING\s*\(([\s\S]*?)\);/i;
      const match = productionSql.match(deletePolicyRegex);
      expect(match).toBeTruthy();
      if (match) {
        expect(match[1]).toContain("public.get_user_org_role(organization_id) IN ('owner', 'admin', 'super_admin')");
      }
    });
  });

  describe('CRIT-04: Metrics Integrity & Anti-Fraud Verification', () => {
    it('capture_public_customer debe verificar la orden contra public.orders antes de incrementar total_spent', () => {
      expect(phase8Sql).toContain('SELECT COALESCE(total, 0), TRUE');
      expect(phase8Sql).toContain('FROM public.orders');
      expect(phase8Sql).toContain("status != 'CANCELLED'");
      expect(phase8Sql).toContain('v_has_verified_order');
    });

    it('debe contar con trigger autoritativo sync_customer_metrics_on_order en public.orders', () => {
      expect(phase8Sql).toContain('CREATE OR REPLACE FUNCTION public.sync_customer_metrics_on_order()');
      expect(phase8Sql).toContain('CREATE TRIGGER trg_sync_customer_metrics');
      expect(productionSql).toContain('CREATE OR REPLACE FUNCTION public.sync_customer_metrics_on_order()');
      expect(productionSql).toContain('CREATE TRIGGER trg_sync_customer_metrics');
    });
  });

  describe('SECURITY DEFINER & Search Path Hardening', () => {
    it('todas las funciones RPC críticas deben declarar search_path = public, pg_temp', () => {
      expect(phase8Sql).toContain('SECURITY DEFINER\nSET search_path = public, pg_temp');
      expect(productionSql).toContain('SECURITY DEFINER\nSET search_path = public, pg_temp');
    });
  });

  describe('Segment Consistency (VIP, FREQUENT, NEW, INACTIVE)', () => {
    it('get_customer_360_profile debe usar INACTIVE en lugar de PROSPECT para clientes sin órdenes', () => {
      expect(phase8Sql).toContain("ELSE 'INACTIVE'");
      expect(phase8Sql).not.toContain("ELSE 'PROSPECT'");
      expect(productionSql).toContain("ELSE 'INACTIVE'");
      expect(productionSql).not.toContain("ELSE 'PROSPECT'");
    });
  });
});
