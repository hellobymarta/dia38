import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useSesion } from '../context/sesion';
import { api } from '../servicios/api';
import { validarComentario } from '../servicios/validacion';
import { enTexto } from '../servicios/fechas';

export default function Comentarios({ publicacionId, comentarios, onCambio }) {
  const { haEntrado, esMio } = useSesion();

  const [nuevo, setNuevo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState('');

  const [editandoId, setEditandoId] = useState(null);
  const [borrador, setBorrador] = useState('');
  const [ocupadoId, setOcupadoId] = useState(null);

  const comentar = async (evento) => {
    evento.preventDefault();

    const errores = validarComentario(nuevo);

    if (errores.texto) {
      setFallo(errores.texto);
      return;
    }

    setEnviando(true);
    setFallo('');

    try {
      const creado = await api.comentar(publicacionId, { texto: nuevo });
      onCambio([...comentarios, creado]);
      setNuevo('');
    } catch (problema) {
      setFallo(problema.message);
    } finally {
      setEnviando(false);
    }
  };

  const guardar = async (id) => {
    const errores = validarComentario(borrador);

    if (errores.texto) {
      setFallo(errores.texto);
      return;
    }

    setOcupadoId(id);
    setFallo('');

    try {
      const actualizado = await api.editarComentario(id, { texto: borrador });
      onCambio(comentarios.map((uno) => (uno.id === id ? actualizado : uno)));
      setEditandoId(null);
    } catch (problema) {
      setFallo(problema.message);
    } finally {
      setOcupadoId(null);
    }
  };

  const borrar = async (id) => {
    setOcupadoId(id);
    setFallo('');

    try {
      await api.borrarComentario(id);
      onCambio(comentarios.filter((uno) => uno.id !== id));
    } catch (problema) {
      setFallo(problema.message);
    } finally {
      setOcupadoId(null);
    }
  };

  return (
    <section className="flex flex-col gap-5 border-t border-borde pt-8">
      <p className="etiqueta">
        {comentarios.length === 0
          ? 'Sin comentarios'
          : `${comentarios.length} ${comentarios.length === 1 ? 'comentario' : 'comentarios'}`}
      </p>

      <ul className="flex flex-col gap-4">
        {comentarios.map((uno) => (
          <li key={uno.id} className="rounded-lg border border-borde bg-hueso p-4">
            {editandoId === uno.id ? (
              <div className="flex flex-col gap-3">
                <textarea
                  rows={3}
                  className="campo"
                  aria-label="Editar el comentario"
                  value={borrador}
                  onChange={(evento) => setBorrador(evento.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="boton-suave"
                    disabled={ocupadoId === uno.id}
                    onClick={() => guardar(uno.id)}
                  >
                    {ocupadoId === uno.id ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button type="button" className="boton-suave" onClick={() => setEditandoId(null)}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-suave">
                  {uno.autor?.nombre || 'Alguien'} · {enTexto(uno.createdAt)}
                </p>
                <p>{uno.texto}</p>

                {esMio(uno) && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      className="boton-suave"
                      onClick={() => {
                        setEditandoId(uno.id);
                        setBorrador(uno.texto);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="boton-suave"
                      disabled={ocupadoId === uno.id}
                      onClick={() => borrar(uno.id)}
                    >
                      {ocupadoId === uno.id ? 'Eliminando…' : 'Eliminar'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {haEntrado ? (
        <form onSubmit={comentar} className="flex flex-col gap-3">
          <label className="etiqueta" htmlFor="nuevo-comentario">
            Deja tu comentario
          </label>
          <textarea
            id="nuevo-comentario"
            rows={3}
            className="campo"
            value={nuevo}
            onChange={(evento) => setNuevo(evento.target.value)}
          />
          <button type="submit" className="boton self-start" disabled={enviando}>
            {enviando ? 'Enviando…' : 'Comentar'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-suave">
          <Link to="/entrar" className="underline hover:text-acento">
            Entra
          </Link>{' '}
          para dejar un comentario.
        </p>
      )}

      {fallo && <p className="text-sm text-red-700">{fallo}</p>}
    </section>
  );
}
