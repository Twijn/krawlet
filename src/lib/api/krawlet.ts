/**
 * Krawlet API client singleton
 * Provides access to the Krawlet API through the krawlet-js library
 */

import { KrawletClient } from 'krawlet-js';

// Create a singleton client instance
// Uses the default API URL: https://api.krawlet.cc
const client = new KrawletClient();

export default client;
