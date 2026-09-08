/**
 * Negocio Flex - usePublicBusinessData Hook (Fase 7)
 * Hook reactivo para cargar los datos del catálogo público mediante GetPublicBusinessDataUseCase.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PublicBusinessData } from '../../domain/entities/public_business_entity';
import { GetPublicBusinessDataUseCase } from '../../domain/usecases/get_public_business_data_usecase';
import { OrganizationRepositoryImpl } from '../../data/repositories/organization_repository_impl';
import { logger } from '../../../../core/utils/logger';

export interface UsePublicBusinessDataReturn {
  loading: boolean;
  error: string | null;
  publicData: PublicBusinessData | null;
  reload: () => Promise<void>;
}

export function usePublicBusinessData(slugOrId: string | undefined): UsePublicBusinessDataReturn {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [publicData, setPublicData] = useState<PublicBusinessData | null>(null);

  // Rastreador de solicitud activa para cancelar respuestas obsoletas en navegaciones rápidas
  const activeRequestIdRef = useRef<number>(0);

  const useCase = useMemo(() => {
    return new GetPublicBusinessDataUseCase(new OrganizationRepositoryImpl());
  }, []);

  const loadData = useCallback(async () => {
    const requestId = ++activeRequestIdRef.current;

    if (!slugOrId || !slugOrId.trim()) {
      setLoading(false);
      setPublicData(null);
      setError(null);
      return;
    }

    const targetSlug = slugOrId.trim();
    setLoading(true);
    setError(null);
    // Limpieza inmediata del estado anterior para evitar mezclar datos entre tenants (Negocio A vs Negocio B)
    setPublicData(null);

    try {
      logger.info('Cargando catálogo público del negocio...', { slugOrId: targetSlug });
      const data = await useCase.execute(targetSlug);

      // Descartar si una solicitud posterior ya inició o el componente se desmontó
      if (activeRequestIdRef.current === requestId) {
        setPublicData(data);
      }
    } catch (err: any) {
      if (activeRequestIdRef.current === requestId) {
        logger.error('Error al cargar datos del catálogo público:', err);
        setError(err?.message || 'Error de conexión al cargar el catálogo');
      }
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [slugOrId, useCase]);

  useEffect(() => {
    loadData();

    return () => {
      // Cancelar solicitud en vuelo al desmontar o al cambiar de slug
      activeRequestIdRef.current++;
    };
  }, [loadData]);

  return {
    loading,
    error,
    publicData,
    reload: loadData,
  };
}
