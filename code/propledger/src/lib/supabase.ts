import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ouxshnkvsovrnkxgjvhq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91eHNobmt2c292cm5reGdqdmhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjczNjAsImV4cCI6MjA4MzA0MzM2MH0.Hjxxjy8G0Pj-y1xP0Hy7FSuEd1JxD5xl5wVbxTsjQq8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Invoke a Supabase Edge Function with proper error handling.
 * This wrapper ensures that response data is available even when the function
 * returns a non-2xx status code.
 * 
 * @param functionName - The name of the Edge Function to invoke
 * @param options - Options including the request body
 * @returns Object containing data, error, and status
 */
export async function invokeEdgeFunction<T = unknown>(
    functionName: string,
    options?: { body?: unknown }
): Promise<{ data: T | null; error: Error | null; status: number | null }> {
    const { body } = options || {};

    try {
        // Use supabase-js invoke which handles auth and headers
        const result = await supabase.functions.invoke(functionName, { body });

        // Success case - return the data
        return { data: result.data as T, error: null, status: 200 };
    } catch (err: unknown) {
        // Extract error information from the thrown error
        const error = err as Error & {
            name?: string;
            message?: string;
            status?: number;
            context?: { status?: number };
        };

        // Try to extract response body from the error
        let responseData: unknown = null;
        let status: number | null = error.status || error.context?.status || null;

        // The error message often contains the response body text
        // For FunctionsHttpError, the message may contain useful info
        if (error.message) {
            // Try to parse the message as JSON (common case for Edge Function errors)
            try {
                responseData = JSON.parse(error.message);
            } catch {
                // If not JSON, use the message as-is
                responseData = error.message;
            }
        }

        // Return the error with any extracted data
        return {
            data: responseData as T,
            error: error instanceof Error ? error : new Error(String(err)),
            status,
        };
    }
}

/**
 * Alternative method using fetch directly for maximum control.
 * Use this when you need to access the full response including headers.
 */
export async function invokeEdgeFunctionWithFetch<T = unknown>(
    functionName: string,
    options?: { body?: unknown }
): Promise<{ data: T | null; error: Error | null; status: number | null; headers?: Headers }> {
    const { body } = options || {};

    try {
        // Get the auth token
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        let responseData: T | null = null;
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
            responseData = await response.json() as T;
        } else {
            responseData = await response.text() as unknown as T;
        }

        if (!response.ok) {
            return {
                data: responseData,
                error: new Error(`Edge Function returned status ${response.status}`),
                status: response.status,
                headers: response.headers,
            };
        }

        return { data: responseData, error: null, status: response.status, headers: response.headers };
    } catch (err) {
        return {
            data: null,
            error: err instanceof Error ? err : new Error(String(err)),
            status: null,
        };
    }
}
