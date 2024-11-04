import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    Paper,
    Button,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import NewServiceForm from './NewServiceForm';
import '../componentsCSS/ServicesTable.css';

const ServicesTable = () => {
    const [services, setServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddServiceModal, setShowAddServiceModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [editFormData, setEditFormData] = useState({ nazwa: '', cena: '' });

    // Pobieranie usług z bazy
    const fetchServices = async () => {
        try {
            const response = await axios.get('/api/uslugi');
            const sortedServices = response.data.sort((a, b) =>
                a.nazwa.localeCompare(b.nazwa, 'pl', { sensitivity: 'base' })
            );
            setServices(sortedServices);
            setSelectedServices([]);
            setSelectAll(false);
        } catch (error) {
            console.error('Błąd podczas pobierania usług:', error);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    // Obsługa edycji usługi
    const handleRowClick = (service) => {
        // Prevent opening edit form if checkbox was clicked
        if (selectedServices.includes(service.id)) return;
        
        setEditingService(service);
        setEditFormData({
            nazwa: service.nazwa,
            cena: service.cena || ''
        });
    };

    const handleEditFormClose = () => {
        setEditingService(null);
        setEditFormData({ nazwa: '', cena: '' });
    };

    const handleEditFormSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/uslugi/${editingService.id}`, editFormData);
            await fetchServices();
            handleEditFormClose();
        } catch (error) {
            console.error('Błąd podczas aktualizacji usługi:', error);
        }
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Pozostałe funkcje bez zmian...
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const filteredServices = services.filter((service) =>
        service.nazwa.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddService = () => {
        setShowAddServiceModal(true);
    };

    const handleSelectService = (id) => {
        setSelectedServices((prevSelected) =>
            prevSelected.includes(id)
                ? prevSelected.filter((serviceId) => serviceId !== id)
                : [...prevSelected, id]
        );
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedServices([]);
        } else {
            setSelectedServices(services.map((service) => service.id));
        }
        setSelectAll(!selectAll);
    };

    const formatPrice = (price) => {
        if (price === null || price === undefined) return '-';
        const numericPrice = parseFloat(price);
        return isNaN(numericPrice) ? '-' : `${numericPrice.toFixed(2)} zł`;
    };

    useEffect(() => {
        if (services.length === 0) {
            setSelectAll(false);
        } else {
            setSelectAll(selectedServices.length === services.length);
        }
    }, [selectedServices, services]);

    const deleteSelectedServices = async () => {
        try {
            await Promise.all(
                selectedServices.map((serviceId) => axios.delete(`/api/uslugi/${serviceId}`))
            );
            fetchServices();
        } catch (error) {
            console.error('Błąd podczas usuwania usług:', error);
        }
    };

    return (
        <div className="container">
            <div className="action-buttons">
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddService}
                    style={{ marginBottom: '10px' }}
                >
                    Dodaj usługę
                </Button>

                {selectedServices.length > 0 && (
                    <Button
                        variant="contained"
                        color="error"
                        onClick={deleteSelectedServices}
                    >
                        <FontAwesomeIcon icon={faTrash} />
                    </Button>
                )}
            </div>

            <div className="search-container">
                <TextField
                    fullWidth
                    label="Wyszukaj usługę"
                    variant="outlined"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
                    disabled={services.length === 0}
                    className="search-field"
                />
            </div>

            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={selectAll}
                                    onChange={handleSelectAll}
                                    color="primary"
                                />
                            </TableCell>
                            <TableCell className="table-head-cell">Nazwa usługi</TableCell>
                            <TableCell className="table-head-cell">Cena</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredServices
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((service) => (
                                <TableRow
                                    key={service.id}
                                    hover
                                    onClick={() => handleRowClick(service)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selectedServices.includes(service.id)}
                                            onChange={() => handleSelectService(service.id)}
                                            color="primary"
                                        />
                                    </TableCell>
                                    <TableCell>{service.nazwa}</TableCell>
                                    <TableCell>{formatPrice(service.cena)}</TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={filteredServices.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Wierszy na stronie:"
            />

            {showAddServiceModal && (
                <NewServiceForm
                    open={showAddServiceModal}
                    onClose={() => {
                        setShowAddServiceModal(false);
                        fetchServices();
                    }}
                    onServiceAdded={() => {
                        setShowAddServiceModal(false);
                        fetchServices();
                    }}
                />
            )}

            {/* Dialog edycji usługi */}
            <Dialog open={!!editingService} onClose={handleEditFormClose}>
                <DialogTitle>Edytuj usługę</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        name="nazwa"
                        label="Nazwa usługi"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={editFormData.nazwa}
                        onChange={handleEditFormChange}
                    />
                    <TextField
                        margin="dense"
                        name="cena"
                        label="Cena"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={editFormData.cena}
                        onChange={handleEditFormChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleEditFormClose}>Anuluj</Button>
                    <Button onClick={handleEditFormSubmit} variant="contained" color="primary">
                        Zapisz
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default ServicesTable;