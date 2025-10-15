#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const PORT = process.env.PORT || '3051'
const isWin = process.platform === 'win32'

const nextBin = isWin ? 'next.cmd' : 'next'
const args = ['dev', '-p', PORT]

const child = spawn(nextBin, args, { stdio: 'inherit', shell: isWin })
child.on('exit', (code) => process.exit(code ?? 1))
child.on('error', (err) => {
  console.error('Failed to start Next dev:', err.message)
  process.exit(1)
})
