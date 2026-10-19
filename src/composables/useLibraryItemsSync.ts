import { onIonViewDidLeave, onIonViewWillEnter } from '@ionic/vue';
import { onMounted, onUnmounted } from 'vue';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';

export const useLibraryItemsSync = (refresh: () => Promise<void>) => {
    let isActive = false;
    let channel: RealtimeChannel | undefined;

    const refreshIfActive = () => {
        if (!isActive) return;

        void refresh().catch((error: unknown) => {
            console.error('Não foi possível atualizar o acervo em tempo real.', error);
        });
    };

    onIonViewWillEnter(() => {
        isActive = true;
        refreshIfActive();
    });

    onIonViewDidLeave(() => {
        isActive = false;
    });

    onMounted(() => {
        channel = supabase
            .channel(`library-items-${crypto.randomUUID()}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'library_items' },
                refreshIfActive
            )
            .subscribe((status, error) => {
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error(
                        'A atualização em tempo real do acervo falhou. Verifique se library_items está habilitada na publicação supabase_realtime.',
                        error
                    );
                }
            });
    });

    onUnmounted(() => {
        if (channel) void supabase.removeChannel(channel);
    });
};
