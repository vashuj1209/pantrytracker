'use client'

import { useState, useEffect } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField } from '@mui/material'
import { firestore } from '@/firebase'
import {
  collection,
  getDocs,
  query,
  getDoc,
  setDoc,
  doc,
  deleteDoc
} from 'firebase/firestore'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const styles = {
  modal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: '#1e1e1e',
    borderRadius: '16px',
    boxShadow: 24,
    p: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  button: {
    borderRadius: '20px',
    textTransform: 'none',
    backgroundColor: '#00bcd4',
    color: 'white',
  },
  inventoryItem: {
    borderRadius: '12px',
    padding: '16px',
    backgroundColor: '#2a2a2a',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    alignItems: 'flex-start',
  },
  container: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: 'calc(100vh - 80px)',
    gap: '20px',
    overflow: 'auto',
  },
  chartContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBackground: {
    background: '#121212',
  },
  inventoryContainer: {
    width: '50%',
    bgcolor: '#1f1f1f',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
    p: 2,
    maxHeight: 'calc(100vh - 80px)',
    overflow: 'auto',
    color: 'white',
  },
  chart: {
    width: '100%',
    height: '100%',
    maxWidth: '600px',
    bgcolor: '#2a2a2a',
    borderRadius: '12px',
    boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
    p: 2,
  },
  searchBarContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    mb: 3,
  },
  searchBar: {
    flex: 1,
    borderRadius: '20px',
    bgcolor: 'white',
    input: {
      color: 'black',
    },
  },
  addButton: {
    borderRadius: '20px',
    textTransform: 'none',
    backgroundColor: '#ff4081',
    color: 'white',
  },
}

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [filteredInventory, setFilteredInventory] = useState([])
  const [openAdd, setOpenAdd] = useState(false)
  const [openUpdate, setOpenUpdate] = useState(false)
  const [itemName, setItemName] = useState('')
  const [description, setDescription] = useState('')
  const [entryDate, setEntryDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [quantity, setQuantity] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItemId, setSelectedItemId] = useState(null)

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = docs.map(doc => ({ id: doc.id, ...doc.data() }))
    setInventory(inventoryList)
    setFilteredInventory(inventoryList)
  }

  const handleInventoryChange = (item, update) => {
    setItemName(item ? item.id : '')
    setDescription(item ? item.description : '')
    setEntryDate(item ? item.entryDate : '')
    setExpiryDate(item ? item.expiryDate : '')
    setQuantity(item ? item.quantity : '')
    setSelectedItemId(item ? item.id : null)
    update ? setOpenUpdate(true) : setOpenAdd(true)
  }

  const addItem = async () => {
    const docRef = doc(collection(firestore, 'inventory'), itemName)
    const docSnap = await getDoc(docRef)
    const itemData = { quantity: parseInt(quantity), description, entryDate, expiryDate }
    if (docSnap.exists()) {
      await setDoc(docRef, { quantity: docSnap.data().quantity + itemData.quantity }, { merge: true })
    } else {
      await setDoc(docRef, itemData)
    }
    handleInventoryChange(null, false)
    await updateInventory()
  }

  const updateItem = async () => {
    const docRef = doc(collection(firestore, 'inventory'), selectedItemId)
    const itemData = { quantity: parseInt(quantity), description, entryDate, expiryDate }
    await setDoc(docRef, itemData, { merge: true })
    handleInventoryChange(null, false)
    await updateInventory()
  }

  const removeItem = async (itemId) => {
    const docRef = doc(collection(firestore, 'inventory'), itemId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, { quantity: quantity - 1 }, { merge: true })
      }
    }
    await updateInventory()
  }

  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase()
    setSearchQuery(query)
    const filtered = inventory.filter(item =>
      item.id.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    )
    setFilteredInventory(filtered)
  }

  useEffect(() => {
    updateInventory()
  }, [])

  const pieData = {
    labels: filteredInventory.map(item => item.id),
    datasets: [
      {
        label: 'Quantity',
        data: filteredInventory.map(item => item.quantity),
        backgroundColor: filteredInventory.map((_, index) => `hsl(${index * 45}, 70%, 50%)`),
        borderWidth: 1,
      },
    ],
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'white',
        },
      },
      tooltip: {
        enabled: true,
      },
    },
  }

  return (
    <Box width="100vw" height="100vh" display="flex" flexDirection="column" alignItems="center" p={3} sx={styles.gradientBackground}>
      <Modal open={openAdd || openUpdate} onClose={() => handleInventoryChange(null, false)}>
        <Box sx={styles.modal}>
          <Typography variant="h6" component="h2" gutterBottom sx={{ color: 'white' }}>
            {openAdd ? 'Add Item' : 'Update Item'}
          </Typography>
          <Stack width="100%" direction="column" spacing={2}>
            {['Item Name', 'Description'].map((label, index) => (
              <TextField
                key={index}
                label={label}
                variant="outlined"
                fullWidth
                value={label === 'Item Name' ? itemName : description}
                onChange={e => label === 'Item Name' ? setItemName(e.target.value) : setDescription(e.target.value)}
                sx={{ borderRadius: '20px', bgcolor: '#2a2a2a', input: { color: 'white' } }}
              />
            ))}
            {['Entry Date', 'Expiry Date'].map((label, index) => (
              <TextField
                key={index}
                label={label}
                type="date"
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={label === 'Entry Date' ? entryDate : expiryDate}
                onChange={e => label === 'Entry Date' ? setEntryDate(e.target.value) : setExpiryDate(e.target.value)}
                sx={{ borderRadius: '20px', bgcolor: '#2a2a2a', input: { color: 'white' } }}
              />
            ))}
            <TextField
              label="Quantity"
              type="number"
              variant="outlined"
              fullWidth
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              sx={{ borderRadius: '20px', bgcolor: '#2a2a2a', input: { color: 'white' } }}
            />
            <Button variant="contained" color
