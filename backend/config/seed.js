import Employee from '../models/Employee.js';
import Client from '../models/Client.js';
import Engagement from '../models/Engagement.js';
import HardwareConfig from '../models/HardwareConfig.js';
import Asset from '../models/Asset.js';
import AssetMovement from '../models/AssetMovement.js';
import Timesheet from '../models/Timesheet.js';
import TimesheetQuery from '../models/TimesheetQuery.js';
import Notification from '../models/Notification.js';

export const seedDatabase = async () => {
  try {
    const employeeCount = await Employee.countDocuments({});
    if (employeeCount > 0) {
      console.log('Database already has data. Skipping seed.');
      return;
    }

    console.log('Seeding Database with sample data...');

    // 1. Create Employees
    // Passwords will be hashed in the pre-save hook
    const adminUser = new Employee({
      name: 'Alice Admin',
      email: 'admin@firm.com',
      password: 'admin123',
      role: 'admin'
    });
    const managerUser = new Employee({
      name: 'Bob Manager',
      email: 'manager@firm.com',
      password: 'manager123',
      role: 'manager'
    });
    
    await adminUser.save();
    await managerUser.save();

    const staff1 = new Employee({
      name: 'Charlie Staff',
      email: 'staff1@firm.com',
      password: 'staff123',
      role: 'staff',
      managerId: managerUser._id
    });
    const staff2 = new Employee({
      name: 'Diana Staff',
      email: 'staff2@firm.com',
      password: 'staff223',
      role: 'staff',
      managerId: managerUser._id
    });

    await staff1.save();
    await staff2.save();

    // 2. Create Clients
    const acme = await Client.create({
      name: 'Acme Corporation',
      industry: 'Technology',
      billingAddress: '123 Silicon Valley Road, San Jose, CA'
    });
    const globex = await Client.create({
      name: 'Globex Industries',
      industry: 'Manufacturing',
      billingAddress: '456 Heavy Industry Lane, Pittsburgh, PA'
    });
    const initech = await Client.create({
      name: 'Initech Corp',
      industry: 'Financial Services',
      billingAddress: '789 Office Park Way, Austin, TX'
    });

    // 3. Create Engagements
    const engagement1 = await Engagement.create({
      clientId: acme._id,
      name: 'Acme Annual Audit 2026',
      status: 'work_in_progress',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days out
      billable: true,
      assignedStaff: [staff1._id, staff2._id]
    });

    const engagement2 = await Engagement.create({
      clientId: globex._id,
      name: 'Globex Corporate Tax Filing',
      status: 'work_in_progress',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days out
      billable: true,
      assignedStaff: [staff1._id]
    });

    const engagement3 = await Engagement.create({
      clientId: initech._id,
      name: 'Initech ERP Implementation',
      status: 'unassigned',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days out
      billable: true,
      assignedStaff: []
    });

    // 4. Create Hardware Configurations
    const m3mac = await HardwareConfig.create({
      brand: 'Apple',
      modelName: 'MacBook Pro M3 Pro',
      deviceType: 'Laptop',
      cpu: 'M3 Pro 11-core',
      ram: '18GB',
      storage: '512GB SSD',
      graphicsCard: 'Apple 14-core GPU',
      operatingSystem: 'macOS Sonoma',
      warrantyInfo: 'AppleCare+ 3 Year',
      additionalSpecs: 'Space Black, Liquid Retina XDR display'
    });

    const dellxps = await HardwareConfig.create({
      brand: 'Dell',
      modelName: 'Dell XPS 15 9530',
      deviceType: 'Laptop',
      cpu: 'Intel Core i7-13700H',
      ram: '32GB',
      storage: '1TB NVMe SSD',
      graphicsCard: 'NVIDIA RTX 4050 6GB',
      operatingSystem: 'Windows 11 Pro',
      warrantyInfo: '3 Year ProSupport Plus',
      additionalSpecs: 'OLED Touch display, Platinum Silver'
    });

    const thinkpad = await HardwareConfig.create({
      brand: 'Lenovo',
      modelName: 'Lenovo ThinkPad T14 Gen 4',
      deviceType: 'Laptop',
      cpu: 'AMD Ryzen 7 PRO 7840U',
      ram: '16GB',
      storage: '512GB NVMe SSD',
      graphicsCard: 'AMD Radeon 780M',
      operatingSystem: 'Windows 11 Pro',
      warrantyInfo: '3 Year Depot Warranty',
      additionalSpecs: 'Intel AX211 Wi-Fi 6E'
    });

    // 5. Create Assets
    const asset1 = await Asset.create({
      configId: m3mac._id,
      assetTag: 'AST-001',
      serialNumber: 'SN-M3P001',
      status: 'Deployed at Client',
      currentUserId: staff1._id,
      purchaseDate: new Date('2025-01-15'),
      purchaseCost: 2499,
      vendor: 'Apple Authorized Reseller',
      warrantyExpiryDate: new Date('2028-01-15'),
      currentLocation: 'Client Site Alpha',
      assetCondition: 'Excellent',
      notes: 'Issued to Charlie for client engagements'
    });

    const asset2 = await Asset.create({
      configId: dellxps._id,
      assetTag: 'AST-002',
      serialNumber: 'SN-DXP002',
      status: 'In Office',
      currentUserId: null,
      purchaseDate: new Date('2025-02-10'),
      purchaseCost: 1999,
      vendor: 'Dell Business Sales',
      warrantyExpiryDate: new Date('2028-02-10'),
      currentLocation: 'Server Room Stock',
      assetCondition: 'New',
      notes: 'Backup laptop in office stock'
    });

    const asset3 = await Asset.create({
      configId: thinkpad._id,
      assetTag: 'AST-003',
      serialNumber: 'SN-LTP003',
      status: 'Deployed at Client',
      currentUserId: staff2._id,
      purchaseDate: new Date('2024-11-05'),
      purchaseCost: 1250,
      vendor: 'CDW Express',
      warrantyExpiryDate: new Date('2027-11-05'),
      currentLocation: 'Client Site Beta',
      assetCondition: 'Good',
      notes: 'Standard staff issue laptop'
    });

    // 6. Create Asset Movements
    // Movement 1: Checked out to Charlie, OVERDUE!
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await AssetMovement.create({
      assetId: asset1._id,
      employeeId: staff1._id,
      checkoutDate: fiveDaysAgo,
      expectedReturnDate: twoDaysAgo, // overdue since actualReturnDate is null
      checkoutCondition: 'Brand new in shrinkwrap',
      remarks: 'Charlie assigned for audit project',
      createdBy: adminUser._id
    });

    // Movement 2: Checked out to Diana, Active but not overdue
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const tenDaysFuture = new Date();
    tenDaysFuture.setDate(tenDaysFuture.getDate() + 10);

    await AssetMovement.create({
      assetId: asset3._id,
      employeeId: staff2._id,
      checkoutDate: threeDaysAgo,
      expectedReturnDate: tenDaysFuture,
      checkoutCondition: 'Excellent condition, minor surface scratch',
      remarks: 'Diana assigned for engagement support',
      createdBy: adminUser._id
    });

    // Movement 3: Historic completed movement
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const twentyFiveDaysAgo = new Date();
    twentyFiveDaysAgo.setDate(twentyFiveDaysAgo.getDate() - 25);

    await AssetMovement.create({
      assetId: asset2._id,
      employeeId: staff2._id,
      checkoutDate: thirtyDaysAgo,
      expectedReturnDate: twentyFiveDaysAgo,
      actualReturnDate: twentyFiveDaysAgo,
      checkoutCondition: 'Brand new',
      returnCondition: 'Excellent, returned in original box',
      remarks: 'Temporary issue for system setup',
      createdBy: adminUser._id,
      updatedBy: adminUser._id
    });

    // 7. Create Timesheets
    const today = new Date();
    const formatDate = (daysOffset) => {
      const target = new Date(today);
      target.setDate(today.getDate() - daysOffset);
      const yyyy = target.getFullYear();
      const mm = String(target.getMonth() + 1).padStart(2, '0');
      const dd = String(target.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    // Charlie's Approved Timesheet for Monday (3 days ago)
    const approvedTS = await Timesheet.create({
      employeeId: staff1._id,
      engagementId: engagement1._id,
      workType: 'Audit Work',
      date: formatDate(3),
      hours: 7.5,
      status: 'approved'
    });

    // Charlie's Submitted Timesheet for Tuesday (2 days ago)
    const submittedTS = await Timesheet.create({
      employeeId: staff1._id,
      engagementId: engagement2._id,
      workType: 'Tax Consulting',
      date: formatDate(2),
      hours: 8,
      status: 'submitted'
    });

    // Diana's Draft Timesheet for Wednesday (1 day ago)
    await Timesheet.create({
      employeeId: staff2._id,
      engagementId: engagement1._id,
      workType: 'Audit Work',
      date: formatDate(1),
      hours: 6.5,
      status: 'draft'
    });

    // Charlie's Rejected Timesheet for last Friday (4 days ago)
    const rejectedTS = await Timesheet.create({
      employeeId: staff1._id,
      engagementId: engagement1._id,
      workType: 'Audit Work',
      date: formatDate(4),
      hours: 4,
      status: 'rejected',
      rejectionComment: 'Please double check the audit hours. Did you include the report review?'
    });

    // 8. Create Timesheet Queries conversation thread
    await TimesheetQuery.create({
      timesheetId: rejectedTS._id,
      senderId: managerUser._id,
      message: `System Alert: Timesheet rejected by Bob Manager with comment: "Please double check the audit hours. Did you include the report review?"`
    });

    await TimesheetQuery.create({
      timesheetId: rejectedTS._id,
      senderId: staff1._id,
      message: `Oh yes, I forgot to log that part. I'll update the hours to include the report review.`
    });

    // 9. Create Notifications
    await Notification.create({
      recipientId: managerUser._id,
      title: 'Timesheets Submitted for Approval',
      body: `Staff member Charlie Staff has submitted timesheet entries for approval.`
    });

    await Notification.create({
      recipientId: staff1._id,
      title: 'Timesheet Entry Rejected',
      body: `Your timesheet entry for date ${rejectedTS.date} was rejected by Bob Manager. Reason: Please double check the audit hours. Did you include the report review?`
    });

    await Notification.create({
      recipientId: staff1._id,
      title: 'IT Asset Overdue Alert',
      body: `Your checkout of asset AST-001 was due on ${twoDaysAgo.toLocaleDateString()}. Please return it to IT or request an extension.`
    });

    console.log('Database Seeding Completed Successfully!');
  } catch (error) {
    console.error(`Database seeding failed: ${error.message}`);
  }
};
