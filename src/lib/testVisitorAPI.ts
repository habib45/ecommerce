import { supabase } from './supabase/client';

// Test function to debug visitor analytics API
export async function testVisitorAPI() {
  console.log('=== Visitor Analytics API Debug ===');
  
  try {
    // Test 1: Direct table access
    console.log('Test 1: Direct table access');
    const { data: directData, error: directError } = await supabase
      .from('visitor_analytics')
      .select('*')
      .limit(5);
    
    console.log('Direct access result:', { directData, directError });
    
    // Test 2: Date range query (same as API)
    console.log('Test 2: Date range query');
    const { data: rangeData, error: rangeError } = await supabase
      .from('visitor_analytics')
      .select('*')
      .gte('date', '2026-02-05')
      .lte('date', '2026-08-06')
      .order('date', { ascending: false });
    
    console.log('Date range result:', { rangeData, rangeError });
    
    // Test 3: Try to insert test data
    console.log('Test 3: Insert test data');
    const { data: insertData, error: insertError } = await supabase
      .from('visitor_analytics')
      .upsert({
        date: new Date().toISOString().split('T')[0],
        visitors: 888,
        page_views: 8888,
        unique_visitors: 888,
        bounce_rate: 88.88,
        avg_session_duration: 888
      }, {
        onConflict: 'date'
      });
    
    console.log('Insert result:', { insertData, insertError });
    
    // Test 4: Try RPC function
    console.log('Test 4: RPC function');
    const { data: rpcData, error: rpcError } = await supabase.rpc('insert_visitor_analytics', {
      p_date: new Date().toISOString().split('T')[0],
      p_visitors: 777,
      p_page_views: 7777,
      p_unique_visitors: 777,
      p_bounce_rate: 77.77,
      p_avg_session_duration: 777
    });
    
    console.log('RPC result:', { rpcData, rpcError });
    
    return {
      directAccess: { data: directData, error: directError },
      dateRange: { data: rangeData, error: rangeError },
      insert: { data: insertData, error: insertError },
      rpc: { data: rpcData, error: rpcError }
    };
    
  } catch (err) {
    console.error('API test failed:', err);
    return { error: err };
  }
}
