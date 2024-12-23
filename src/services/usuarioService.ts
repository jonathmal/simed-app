import Servicio from '@/models/Servicio' //Antes no estaba importado
import Usuario from '@/models/Usuario'
import jwt from 'jsonwebtoken'
import { connectToDatabase } from '../lib/db'

// User Service Functions
console.log('Servicio', Servicio)
const loginUsuario = async (email: string, password: string) => {
  await connectToDatabase()
  const usuario = await Usuario.findOne({ email }).select('+password')
  // .populate('servicio')
  if (!usuario || !usuario.activo) {
    throw new Error('Credenciales inválidas')
  }

  const passwordValido = await usuario.compararPassword(password)
  console.log('passwordValido', passwordValido)
  if (!passwordValido) {
    throw new Error('Credenciales inválidas')
  }

  const token = jwt.sign(
    { id: usuario._id, role: usuario.rol },
    process.env.JWT_SECRET!,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    }
  )

  return {
    token,
    usuario: {
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      servicio: usuario.servicio,
    },
  }
}

const registerUsuario = async (data: any) => {
  await connectToDatabase()

  const usuarioExistente = await Usuario.findOne({ email: data.email })
  if (usuarioExistente) {
    throw new Error('El usuario ya existe')
  }

  const usuario = await Usuario.create(data)
  return {
    id: usuario._id,
    nombre: usuario.nombre,
    email: usuario.email,
    servicio: usuario.servicio,
    rol: usuario.rol,
  }
}

const deactivateUsuario = async (id: string) => {
  await connectToDatabase()

  const usuario = await Usuario.findByIdAndUpdate(
    id,
    { activo: false },
    { new: true }
  )
  if (!usuario) {
    throw new Error('Usuario no encontrado')
  }

  return usuario
}

const activateUsuario = async (id: string) => {
  await connectToDatabase()

  const usuario = await Usuario.findByIdAndUpdate(
    id,
    { activo: true },
    { new: true }
  )
  if (!usuario) {
    throw new Error('Usuario no encontrado')
  }

  return usuario
}

const updateUsuario = async (id: string, updates: any) => {
  await connectToDatabase()

  const usuario = await Usuario.findByIdAndUpdate(id, updates, {
    new: true,
  }).populate('servicio')
  if (!usuario) {
    throw new Error('Usuario no encontrado')
  }

  return usuario
}

const fetchAllUsuarios = async () => {
  await connectToDatabase()
  const usuarios = await Usuario.find().select('-password')
  const mapped = usuarios.map((usuario) => ({
    _id: usuario._id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    servicio: usuario.servicio,
    activo: usuario.activo,
    createdAt: usuario.createdAt,
  }))
  return mapped
}

export {
  loginUsuario,
  registerUsuario,
  deactivateUsuario,
  activateUsuario,
  updateUsuario,
  fetchAllUsuarios,
}
