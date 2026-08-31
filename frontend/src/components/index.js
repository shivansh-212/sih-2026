/**
 * BHU-ID Modular Component Registry
 * Organizes UI into intuitive sub-domains:
 * - Map & Geospatial Layer
 * - Navigation & Analytics Panels
 * - Inspection & Census Drawers
 * - Administration & Audit Modals
 */

// 1. Map & GIS
export { MapView } from './map/MapView';

// 2. Navigation, Header & HUD
export { TopNav } from './navigation/TopNav';
export { MetricsPanel } from './navigation/MetricsPanel';
export { LiveToastFeed } from './navigation/LiveToastFeed';

// 3. Drawers & Inspection Panels
export { AIHouseCountDrawer } from './drawers/AIHouseCountDrawer';
export { PropertyDetailPanel } from './drawers/PropertyDetailPanel';

// 4. Modals & Hubs
export { AdminModal } from './modals/AdminModal';
export { ConflictAuditModal } from './modals/ConflictAuditModal';
export { FieldCaptureModal } from './modals/FieldCaptureModal';
export { IdentityResolutionModal } from './modals/IdentityResolutionModal';

// 5. System Loading & Splash
export { LoadingScreen } from './loading/LoadingScreen';

// 6. Interactive Tutorial & Onboarding
export { TutorialOverlay } from './tutorial/TutorialOverlay';

