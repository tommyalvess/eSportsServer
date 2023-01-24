import express from 'express'
import {PrismaClient} from '@prisma/client'
import cors from 'cors'


import { convertHoursToMinutes } from './utils/convertHourToMinutes'
import { convertMinutesToHours } from './utils/converterMinutesToHours'

const app = express()
const prisma = new PrismaClient() // ele faz a conexao com o db automaticamente 

app.use(express.json())
app.use(cors()) //alterar o origin com o seu urls seu dominio

//HTTP code 
//com inicio 2 é sempre sucesso
//com inicio 3 é redirecionamentos
//com inciio 4 é erros da app
//com inciio 5 é erros inesperados 
//Pesquisar na mdm sobre status code 


app.get('/games', async (req, res) => {
    //seria uma busca com o join para trazer informacao de outra tabela
    const games = await prisma.games.findMany({
        include: {
           _count: {
            select: {
                ads: true,
            }
           }
        }
    })
    return res.status(200).json(games)
})

app.post('/games/:id/ads', async (req, res) => {
    const gamesId: string = req.params.id
    const body: any = req.body

    const ad = await prisma.ad.create({
        data: {
            gamesId,
            name: body.name,
            yearsPlaying: body.yearsPlaying,
            discord: body.discord,
            weekDays: body.weekDays.join(','),
            hourStart: convertHoursToMinutes(body.hourStart),
            hourEnd: convertHoursToMinutes(body.hourEnd),
            useVoiceChannel: body.useVoiceChannel
        }
    })

    return res.status(201).json(ad)
}) 

//Listar dos games com id enviado os ads deles
app.get('/games/:id/ads', async (req,res) => {
    const gamesId = req.params.id

    const ads = await prisma.ad.findMany({
        select: {
            id: true,
            name: true,
            weekDays: true,
            useVoiceChannel: true,
            yearsPlaying: true,
            hourEnd: true,
            hourStart: true
        },
        where: {
            gamesId,
        },
        orderBy: {
            createAt: 'desc'
        }
    })
    return res.status(200).json(ads.map(ad => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(','),
            hourStart: convertMinutesToHours(ad.hourStart),
            hourEnd: convertMinutesToHours(ad.hourEnd)
        }
    }))
})

//Listar dos ads com id enviado os discord 
app.get('/ads/:id/discord', async (req,res) => {
    const adId = req.params.id

    const ad = await prisma.ad.findUniqueOrThrow({
        select: {
            discord: true,
        },
        where: {
            id: adId,
        }
    }) 
    return res.status(200).json({
        discord: ad.discord,
    })
})


app.listen(3333) 