import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: [
      {
        find: 'datatables.net-css',
        replacement: path.resolve(
          __dirname,
          'node_modules/datatables.net-dt/css/jquery.dataTables.min.css'
        ),
      },
    ],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },
});
