import { supabase } from './supabase/client';

// Test function to verify visitor tracking works
export async function testVisitorTracking() {
  console.log('Testing visitor tracking...');
  
  try {
    // Test if we can read from the table first
    const { data: tableData, error: tableError } = await supabase
      .from('visitor_analytics')
      .select('*')
      .limit(1);
    
    console.log('Table access test result:', { tableData, tableError });
    
    if (tableError) {
      console.error('Table access error:', tableError);
      console.log('This might mean the table doesn\'t exist or permissions are missing');
      return false;
    }
    
    // Test direct insert
    const today = new Date().toISOString().split('T')[0];
    const { data: insertData, error: insertError } = await supabase
      .from('visitor_analytics')
      .upsert({
        date: today,
        visitors: 1,
        page_views: 1,
        unique_visitors: 1,
        bounce_rate: 50.5,
        avg_session_duration: 120
      }, {
        onConflict: 'date'
      });
    
    console.log('Direct insert test result:', { insertData, insertError });
    
    if (insertError) {
      console.error('Direct insert error:', insertError);
      
      // Try RPC as fallback
      console.log('Trying RPC function as fallback...');
      const { data, error } = await supabase.rpc('track_daily_visitors', {
        p_date: '2024-01-01',
        p_visitors: 1,
        p_page_views: 1,
        p_unique_visitors: 1,
        p_bounce_rate: 50.5,
        p_avg_session_duration: 120
      });
      
      console.log('RPC test result:', { data, error });
      
      if (error) {
        console.error('RPC function also failed:', error);
        console.log('Both direct insert and RPC failed - migrations may not be applied');
        return false;
      }
    }
    
    console.log('Visitor tracking test passed!');
    return true;
    
  } catch (err) {
    console.error('Test failed:', err);
    return false;
  }
}
