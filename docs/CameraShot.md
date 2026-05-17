Pipeline claro y directo para capturar una imagen lado a lado (2560×720) y convertirla a anaglifo rojo‑cian optimizado (JPEG calidad 70%) en una Raspberry Pi Zero 2W.

**Requisito previo (se ejecuta una sola vez):**
```bash
v4l2-ctl --set-fmt-video=width=2560,height=720,pixelformat=MJPG
```
Esto fuerza la cámara a entregar los fotogramas directamente comprimidos en JPEG por hardware, sin carga de CPU. La exposición manual debe mantenerse como ya tienes configurado.

---

**Pipeline, paso a paso:**

1. **Capturar un fotograma JPEG único desde el buffer V4L2**  
   ```bash
   v4l2-ctl --stream-mmap --stream-count=1 --stream-to=captura.jpg
   ```
   El archivo `captura.jpg` contiene la imagen completa 2560×720 comprimida, creada por el hardware de la cámara. Se evita cualquier paso intermedio de decodificación/recodificación.

2. **Cargar la imagen en memoria con Pillow (Python)**  
   ```python
   from PIL import Image
   img = Image.open("captura.jpg")   # Modo RGB, tamaño 2560×720
   ```
   No se necesita OpenCV ni numpy; Pillow es suficiente y ligero.

3. **Separar las dos vistas**  
   ```python
   left  = img.crop((0, 0, 1280, 720))          # columnas 0 a 1279
   right = img.crop((1280, 0, 2560, 720))       # columnas 1280 a 2559
   ```

4. **Crear el anaglifo rojo‑cian**  
   Se combinan los canales de forma directa:
   ```python
   R, G, B = left.split()      # canales de la vista izquierda
   r, g, b = right.split()     # canales de la vista derecha
   anaglyph = Image.merge("RGB", (R, g, b))
   ```
   El ojo izquierdo recibe el rojo (canal R de izquierda); el derecho recibe cian (canales G y B de derecha). Pillow ejecuta estas operaciones en C, sin bucles Python.

5. **Guardar y transmitir el anaglifo como JPEG de calidad 70%**  
   ```python
   anaglyph.save("anaglifo.jpg", quality=70)
   ```
   Esto reduce el tamaño del archivo entre 3 y 5 veces respecto a calidades cercanas al 95%, con pérdida visual casi imperceptible.

---

**Resumen de ventajas para la Pi Zero 2W**  
- La compresión JPEG inicial la hace el hardware de la cámara (sin CPU).  
- Solo se decodifica una vez (al cargar `captura.jpg`) y se recodifica al final.  
- La transformación a anaglifo consiste en copiar canales, operación casi inmediata.  
- Memoria ocupada: ~2.8 MB por la imagen abierta, muy por debajo de los límites de la placa.  
- Dependencia única: Pillow (sin OpenCV ni numpy, reduciendo tiempo de arranque y complejidad).
