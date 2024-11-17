// static/js/scripts.js
(function ($) {
    $(document).ready(function () {

        // Initialize Bootstrap tooltips
        var tooltipTriggerList = [].slice.call(
            document.querySelectorAll('[data-bs-toggle="tooltip"]')
        );
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });

        // Pricing Discrepancies Page Scripts
        if ($('#discrepancies-table').length) {
            // Initialize DataTables for Discrepancies Table
            $('#discrepancies-table').DataTable({
                paging: true,
                searching: true,
                ordering: true,
                info: true,
                responsive: true,
                pageLength: 10,
                lengthChange: false
            });

            // Set up event handlers for discrepancies
            setupDiscrepanciesEventHandlers();
        }

        function setupDiscrepanciesEventHandlers() {
            // Approve individual discrepancy
            $(document).on('click', '.approve-btn', function () {
                let itemId = $(this).data('id');
                updateDiscrepancy('approve', [itemId]);
            });

            // Dismiss individual discrepancy
            $(document).on('click', '.dismiss-btn', function () {
                let itemId = $(this).data('id');
                updateDiscrepancy('dismiss', [itemId]);
            });

            // Approve selected discrepancies
            $('#approve-selected').click(function () {
                let selectedIds = getSelectedDiscrepancyIds();
                if (selectedIds.length === 0) {
                    showNotification('warning', 'No items selected.');
                    return;
                }
                showConfirmationModal('Are you sure you want to approve the selected discrepancies?', function () {
                    updateDiscrepancy('approve', selectedIds);
                });
            });

            // Dismiss selected discrepancies
            $('#dismiss-selected').click(function () {
                let selectedIds = getSelectedDiscrepancyIds();
                if (selectedIds.length === 0) {
                    showNotification('warning', 'No items selected.');
                    return;
                }
                showConfirmationModal('Are you sure you want to dismiss the selected discrepancies?', function () {
                    updateDiscrepancy('dismiss', selectedIds);
                });
            });

            // Select/Deselect all checkboxes
            $('#select-all').change(function () {
                $('.item-checkbox').prop('checked', $(this).prop('checked'));
            });

            // Handle individual checkbox change to update "Select All" checkbox
            $(document).on('change', '.item-checkbox', function () {
                if ($('.item-checkbox:checked').length === $('.item-checkbox').length) {
                    $('#select-all').prop('checked', true);
                } else {
                    $('#select-all').prop('checked', false);
                }
            });
        }

        // Function to get selected discrepancy IDs
        function getSelectedDiscrepancyIds() {
            let selected = [];
            $('.item-checkbox:checked').each(function () {
                selected.push($(this).val());
            });
            return selected;
        }

        // Function to update discrepancies (approve or dismiss)
        function updateDiscrepancy(action, itemIds) {
            $.ajax({
                url: '/pricing_update/' + action,
                type: 'POST',
                data: JSON.stringify({ item_ids: itemIds }),
                contentType: 'application/json',
                success: function (response) {
                    if (response.status === 'success') {
                        showNotification('success', response.message);
                        // Remove updated items from the table
                        itemIds.forEach(function (id) {
                            let row = $('#item-' + id);
                            $('#discrepancies-table').DataTable().row(row).remove().draw();
                        });
                    } else {
                        showNotification('danger', response.message);
                    }
                },
                error: function (xhr) {
                    console.error('Error:', xhr.responseText);
                    showNotification('danger', 'An error occurred while processing the request.');
                }
            });
        }

        // Function to show notifications using Bootstrap Toasts
        function showNotification(type, message) {
            let toastEl = document.getElementById('notificationToast');
            document.getElementById('toast-title').textContent = type.charAt(0).toUpperCase() + type.slice(1);
            document.getElementById('toast-body').textContent = message;

            // Adjust toast classes based on notification type
            toastEl.className = `toast text-bg-${type}`;
            var toast = new bootstrap.Toast(toastEl);
            toast.show();
        }

        // Function to show confirmation modal
        function showConfirmationModal(message, confirmCallback) {
            document.getElementById('confirmationModalBody').textContent = message;
            var confirmBtn = document.getElementById('confirmActionBtn');

            // Remove previous event listeners
            var newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

            newConfirmBtn.addEventListener('click', function () {
                confirmCallback();
                var modalEl = document.getElementById('confirmationModal');
                var modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();
            });

            var modalEl = document.getElementById('confirmationModal');
            var modal = new bootstrap.Modal(modalEl);
            modal.show();
        }

        // Line Items Page Scripts
        if ($('#line-items-table').length) {
            // Initialize DataTables for Line Items Table
            $('#line-items-table').DataTable({
                paging: true,
                searching: true,
                ordering: true,
                info: true,
                pageLength: 10,
                lengthChange: false
            });

            // Approve individual item with modal
            $('.approve-btn').click(function () {
                const modal = new bootstrap.Modal(document.getElementById('approveModal'));
                const form = $('#approve-form');

                // Populate modal fields with item data
                form.find('#code').val($(this).data('part'));
                form.find('#description').val($(this).data('description'));
                form.find('#price').val($(this).data('price'));
                // Populate other fields as needed

                // Show the modal
                modal.show();

                // Handle the confirm button click
                $('#confirm-approval').off('click').on('click', function () {
                    const formData = new FormData(form[0]);
                    const itemId = form.find('#code').val();

                    // Use the new route for popup approval
                    fetch(`/line_items/approve/${itemId}`, {
                        method: 'POST',
                        body: formData
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.status === 'success') {
                                showNotification('success', data.message);
                                modal.hide();
                                location.reload();
                            } else {
                                showNotification('danger', 'Error approving item: ' + data.message);
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            showNotification('danger', 'An error occurred while processing the request.');
                        });
                });
            });

            // Deny individual item
            $('.deny-btn').click(function () {
                let itemId = $(this).data('id');
                approveDenyLineItem(itemId, 'deny');
            });

            // Approve selected items
            $('#approve-selected').click(function () {
                bulkActionLineItems('approve');
            });

            // Deny selected items
            $('#deny-selected').click(function () {
                bulkActionLineItems('deny');
            });

            // Select/Deselect all checkboxes
            $('#select-all').change(function () {
                $('.item-checkbox').prop('checked', $(this).prop('checked'));
            });
        }

        // Function to approve or deny a line item
        function approveDenyLineItem(itemId, action) {
            let url = '';
            if (action === 'approve') {
                url = `/approve/${itemId}`;
            } else if (action === 'deny') {
                url = `/deny/${itemId}`;
            }

            $.ajax({
                url: url,
                type: 'POST',
                success: function (response) {
                    if (response.status === 'success') {
                        showNotification('success', response.message);
                        // Update the row's status and disable buttons
                        let row = $(`#invoice-${itemId}`);
                        row.find('.btn-success, .btn-secondary').remove();
                        if (action === 'approve') {
                            row.addClass('table-success');
                        } else {
                            row.addClass('table-danger');
                        }
                    } else {
                        showNotification('danger', response.message);
                    }
                },
                error: function (xhr) {
                    showNotification('danger', 'An error occurred while processing the request.');
                }
            });
        }

        // Function to perform bulk actions on line items
        function bulkActionLineItems(action) {
            let selected = [];
            $('.item-checkbox:checked').each(function () {
                selected.push($(this).val());
            });

            if (selected.length === 0) {
                showNotification('warning', 'No items selected.');
                return;
            }

            showConfirmationModal(`Are you sure you want to ${action} the selected items?`, function () {
                $.ajax({
                    url: '/bulk_action',
                    type: 'POST',
                    data: JSON.stringify({ action: action, item_ids: selected }),
                    contentType: 'application/json',
                    success: function (response) {
                        if (response.status === 'success') {
                            showNotification('success', response.message);
                            location.reload();
                        } else {
                            showNotification('danger', response.message);
                        }
                    },
                    error: function (xhr) {
                        showNotification('danger', 'An error occurred while processing the bulk action.');
                    }
                });
            });
        }

        // Manual Review Page Scripts
        if ($('#manual-review-table').length) {
            // Initialize DataTables for Manual Review Table
            $('#manual-review-table').DataTable({
                paging: true,
                searching: true,
                ordering: true,
                info: true,
                pageLength: 10,
                lengthChange: false
            });

            // Approve selected items in Manual Review
            $('#approve-selected-review').click(function () {
                bulkActionReview('approve');
            });

            // Deny selected items in Manual Review
            $('#deny-selected-review').click(function () {
                bulkActionReview('deny');
            });

            // Select/Deselect all checkboxes in Manual Review
            $('#select-all-review').change(function () {
                $('.review-checkbox').prop('checked', $(this).prop('checked'));
            });
        }

        // Function to perform bulk actions in Manual Review
        function bulkActionReview(action) {
            let selected = [];
            $('.review-checkbox:checked').each(function () {
                selected.push($(this).val());
            });

            if (selected.length === 0) {
                showNotification('warning', 'No items selected.');
                return;
            }

            showConfirmationModal(`Are you sure you want to ${action} the selected items?`, function () {
                $.ajax({
                    url: '/bulk_action',
                    type: 'POST',
                    data: JSON.stringify({ action: action, item_ids: selected }),
                    contentType: 'application/json',
                    success: function (response) {
                        if (response.status === 'success') {
                            showNotification('success', response.message);
                            location.reload();
                        } else {
                            showNotification('danger', response.message);
                        }
                    },
                    error: function (xhr) {
                        showNotification('danger', 'An error occurred while processing the bulk action.');
                    }
                });
            });
        }

        // Initialize Charts if needed (assuming you have charts on some pages)
        initializeCharts();

        // Chart.js Initialization
        function initializeCharts() {
            // Invoices Scanned Chart
            if ($('#invoicesChart').length) {
                var ctxInvoices = document.getElementById('invoicesChart').getContext('2d');
                new Chart(ctxInvoices, {
                    type: 'doughnut',
                    data: {
                        labels: ['Completed', 'Pending'],
                        datasets: [
                            {
                                data: [
                                    $('#invoicesChart').data('completed'),
                                    $('#invoicesChart').data('pending')
                                ],
                                backgroundColor: ['#4CAF50', '#FF9800']
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'bottom' }
                        }
                    }
                });
            }

            // Other charts can be initialized similarly
        }
    });
})(jQuery);
