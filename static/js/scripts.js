// static/js/scripts.js
(function ($) {
    $(document).ready(function () {
        // Line Items Page Scripts
        if ($('#line-items-table').length) {
            // Approve individual item with modal
            $('.approve-btn').click(function () {
                const modal = new bootstrap.Modal(document.getElementById('approveModal')); // Bootstrap modal instance
                const form = $('#approve-form'); // Form inside modal

                // Populate modal fields with item data
                form.find('#code').val($(this).data('part'));
                form.find('#name').val(''); // Optional: populate with default value if needed
                form.find('#description').val($(this).data('description'));
                form.find('#price').val($(this).data('price'));
                form.find('#member_price').val('');
                form.find('#add_on_price').val('');
                form.find('#member_add_on_price').val('');
                form.find('#hours').val('0.00000');
                form.find('#taxable').prop('checked', false);
                form.find('#membership_discount').prop('checked', false);
                form.find('#auto_replenish').prop('checked', false);

                // Show the modal
                modal.show();

                // Handle the confirm button click
                $('#confirm-approval').off('click').on('click', function () {
                    const formData = new FormData(form[0]);
                    const itemId = form.find('#code').val(); // Use item ID

                    // Use the new route for popup approval
                    fetch(`/line_items/approve/${itemId}`, {
                        method: 'POST',
                        body: formData
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.status === 'success') {
                                alert(data.message);
                                modal.hide();
                                location.reload(); // Reload the page to reflect changes
                            } else {
                                alert('Error approving item: ' + data.message);
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('An error occurred while processing the request.');
                        });
                });
            });

            // Other existing functions (bulk action, deny, etc.)
        }

        // Deny individual item
        $('.deny-btn').click(function () {
            let itemId = $(this).data('id');
            approveDenyItem(itemId, 'deny');
        });

        // Approve selected items
        $('#approve-selected').click(function () {
            bulkAction('approve');
        });

        // Deny selected items
        $('#deny-selected').click(function () {
            bulkAction('deny');
        });

        // Select/Deselect all checkboxes
        $('#select-all').change(function () {
            $('.item-checkbox').prop('checked', $(this).prop('checked'));
        });

        // Refresh the list
        $('#refresh-list').click(function () {
            location.reload();
        });

        // Submit all approvals
        $('#submit-approvals').click(function () {
            if (confirm('Are you sure you want to submit all approved items to the CRM?')) {
                $.ajax({
                    url: '/submit_approvals',
                    type: 'POST',
                    success: function (response) {
                        if (response.status === 'success') {
                            alert(response.message);
                            location.reload();
                        }
                    },
                    error: function (xhr) {
                        alert('An error occurred while submitting approvals.');
                    }
                });
            }
        });

        // Cancel approvals
        $('#cancel-approvals').click(function () {
            if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
                location.reload();
            }
        });

        // Initialize DataTables for Line Items Table
        $('#line-items-table').DataTable({
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            pageLength: 10,
            lengthChange: false
        });

        // Pricebook Items Page Scripts
        if ($('#pricebook-items-table').length) {
            // Initialize DataTables for Pricebook Items Table
            $('#pricebook-items-table').DataTable({
                paging: true,
                searching: true,
                ordering: true,
                info: true,
                pageLength: 10,
                lengthChange: false
            });

            // Add any event handlers specific to Pricebook Items here
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

        // Initialize Bootstrap tooltips
        var tooltipTriggerList = [].slice.call(
            document.querySelectorAll('[data-bs-toggle="tooltip"]')
        );
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });

        // Function to approve or deny an item
        function approveDenyItem(itemId, action) {
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
                        // Update the row's status and disable buttons
                        let row = $(`#invoice-${itemId}`);
                        if (action === 'approve') {
                            row
                                .find('td:nth-child(6)')
                                .text('Approved')
                                .removeClass('text-warning')
                                .addClass('text-success');
                            row.find('.btn-success, .btn-secondary').remove();
                            row.addClass('table-success');
                        } else {
                            row
                                .find('td:nth-child(6)')
                                .text('Denied')
                                .removeClass('text-warning')
                                .addClass('text-danger');
                            row.find('.btn-success, .btn-secondary').remove();
                            row.addClass('table-danger');
                        }
                    } else {
                        alert(response.message);
                    }
                },
                error: function (xhr) {
                    alert('An error occurred while processing the request.');
                }
            });
        }

        // Function to perform bulk actions
        function bulkAction(action) {
            let selected = [];
            $('.item-checkbox:checked').each(function () {
                selected.push($(this).val());
            });

            if (selected.length === 0) {
                alert('No items selected.');
                return;
            }

            if (!confirm(`Are you sure you want to ${action} the selected items?`)) {
                return;
            }

            $.ajax({
                url: '/bulk_action',
                type: 'POST',
                data: {
                    action: action,
                    item_ids: selected
                },
                success: function (response) {
                    if (response.status === 'success') {
                        // Reload the page to reflect changes
                        location.reload();
                    } else {
                        alert(response.message);
                    }
                },
                error: function (xhr) {
                    alert('An error occurred while processing the bulk action.');
                }
            });
        }

        // Function to perform bulk actions in Manual Review
        function bulkActionReview(action) {
            let selected = [];
            $('.review-checkbox:checked').each(function () {
                selected.push($(this).val());
            });

            if (selected.length === 0) {
                alert('No items selected.');
                return;
            }

            if (!confirm(`Are you sure you want to ${action} the selected items?`)) {
                return;
            }

            $.ajax({
                url: '/bulk_action',
                type: 'POST',
                data: {
                    action: action,
                    item_ids: selected
                },
                success: function (response) {
                    if (response.status === 'success') {
                        // Reload the page to reflect changes
                        location.reload();
                    } else {
                        alert(response.message);
                    }
                },
                error: function (xhr) {
                    alert('An error occurred while processing the bulk action.');
                }
            });
        }

        // Chart.js Initialization
        function initializeCharts() {
            // Invoices Scanned Chart
            if ($('#invoicesChart').length) {
                var ctxInvoices = document
                    .getElementById('invoicesChart')
                    .getContext('2d');
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

            // Items Added Chart
            if ($('#itemsChart').length) {
                var ctxItems = document
                    .getElementById('itemsChart')
                    .getContext('2d');
                new Chart(ctxItems, {
                    type: 'doughnut',
                    data: {
                        labels: ['New Items', 'Existing Items'],
                        datasets: [
                            {
                                data: [
                                    $('#itemsChart').data('new'),
                                    $('#itemsChart').data('existing')
                                ],
                                backgroundColor: ['#2196F3', '#FFC107']
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

            // Pricing Corrections Chart
            if ($('#correctionsChart').length) {
                var ctxCorrections = document
                    .getElementById('correctionsChart')
                    .getContext('2d');
                new Chart(ctxCorrections, {
                    type: 'doughnut',
                    data: {
                        labels: ['Corrected', 'Pending'],
                        datasets: [
                            {
                                data: [
                                    $('#correctionsChart').data('corrected'),
                                    $('#correctionsChart').data('pending')
                                ],
                                backgroundColor: ['#9C27B0', '#E91E63']
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
        }

        // Initialize Charts
        initializeCharts();
    });
})(jQuery);
