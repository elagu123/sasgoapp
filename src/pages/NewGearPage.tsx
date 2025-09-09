import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast.ts';
import { MOCK_PRODUCT_CATALOG } from '../constants.ts';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';
import { useGears } from '../hooks/useGears.ts';

const CameraScanner: React.FC<{ onScan: (data: string) => void }> = ({ onScan }) => (
    <div className="w-full h-48 bg-gray-900 rounded-lg flex flex-col items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.636-6.364l.707.707M19 19l-7-7-7 7"/></svg>
        <p className="text-sm">Simulador de Cámara QR</p>
        <button onClick={() => onScan('ST-MOVA-24-CEL-AB12CD34')} className="mt-2 text-xs bg-blue-500 px-2 py-1 rounded">Escanear Mova</button>
        <button onClick={() => onScan('ST-CAPRI-23-ROJ-EF56GH78')} className="mt-2 text-xs bg-blue-500 px-2 py-1 rounded">Escanear Capri</button>
    </div>
);

const NewGearPage: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const isOnline = useOnlineStatus();
    const [serial, setSerial] = useState('');
    const [product, setProduct] = useState<any>(null);
    
    const { createGear } = useGears();

    const handleSerialCheck = (code: string) => {
        setSerial(code);
        const modelCode = code.split('-').slice(0, 3).join('-');
        const foundProduct = MOCK_PRODUCT_CATALOG.find(p => p.modelCode === modelCode);
        if (foundProduct) {
            setProduct(foundProduct);
            addToast(`Modelo encontrado: ${foundProduct.modelName}`, 'success');
        } else {
            addToast('Código de producto no reconocido.', 'error');
            setProduct(null);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const color = serial.split('-')[3];
        const size = product.modelName.includes('Carry-On') ? '24"' : '25L';

        // Calculate warranty expiration
        const purchaseDate = new Date(formData.get('purchaseDate') as string);
        const warrantyExpiresAt = new Date(purchaseDate);
        warrantyExpiresAt.setMonth(warrantyExpiresAt.getMonth() + product.defaultWarrantyMonths);
        
        const registrationData = {
            serial,
            qrCode: `qr-${serial.toLowerCase()}`, // Generate a unique QR code
            modelName: product.modelName,
            color,
            size,
            purchaseDate: purchaseDate.toISOString(),
            channel: formData.get('channel'),
            warrantyExpiresAt: warrantyExpiresAt.toISOString()
        };
        
        createGear.mutate(registrationData, {
            onSuccess: () => {
                addToast('¡Equipaje registrado con éxito!', 'success');
                navigate('/app/gear');
            },
            onError: (error) => {
                addToast(error.message || 'No se pudo registrar el equipaje.', 'error');
            }
        });
    };

    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold mb-6 text-center">Registrar Mi Equipaje</h1>
            
            {!product ? (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">1. Identificá tu producto</h2>
                    <CameraScanner onScan={handleSerialCheck} />
                    <div className="text-center text-gray-500 dark:text-gray-400">o</div>
                    <form onSubmit={(e) => { e.preventDefault(); handleSerialCheck(serial); }} className="flex space-x-2">
                        <input
                            type="text"
                            value={serial}
                            onChange={(e) => setSerial(e.target.value.toUpperCase())}
                            placeholder="Ingresá el código ST-..."
                            className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 font-mono"
                        />
                        <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Verificar</button>
                    </form>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold">2. Confirmá los detalles</h2>
                        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <p><strong>Modelo:</strong> {product.modelName}</p>
                            <p><strong>Código:</strong> {serial}</p>
                            <p><strong>Garantía Estándar:</strong> {product.defaultWarrantyMonths} meses</p>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="purchaseDate" className="block text-sm font-medium">Fecha de Compra</label>
                        <input type="date" name="purchaseDate" id="purchaseDate" required className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label htmlFor="channel" className="block text-sm font-medium">Canal de Compra</label>
                        <select name="channel" id="channel" required className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                            <option value="tienda online">Tienda Online SAS</option>
                            <option value="sucursal">Sucursal Física</option>
                            <option value="ML">Mercado Libre</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="receipt" className="block text-sm font-medium">Comprobante (Opcional)</label>
                        <input type="file" name="receipt" id="receipt" className="mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                    </div>
                    <div className="pt-4 border-t dark:border-gray-700">
                         <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input id="warranty-terms" type="checkbox" required className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded" />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="warranty-terms" className="font-medium">Acepto los <a href="#" className="text-blue-600 hover:underline">términos y condiciones</a> para activar mi garantía.</label>
                            </div>
                        </div>
                    </div>
                     <button type="submit" disabled={createGear.isPending} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400">
                      {createGear.isPending ? 'Registrando...' : 'Activar Garantía y Registrar'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default NewGearPage;