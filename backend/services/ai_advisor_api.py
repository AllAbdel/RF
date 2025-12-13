import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import random

app = FastAPI(
    title="RentFlow AI Advisor",
    description="Intelligence artificielle pour l'optimisation des revenus d'agence de location",
    version="2.0.0"
)

# Configuration CORS pour permettre les requêtes depuis le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODÈLES DE DONNÉES ---

class CarStats(BaseModel):
    model_name: str
    category: str
    total_revenue: float
    average_rating: float
    negative_reviews_count: int
    maintenance_cost: float
    occupancy_days: int
    price_per_hour: float

class FleetStatus(BaseModel):
    total_cars: int
    available_cars: int
    utilization_rate: float
    cars_needing_maintenance: int

class AgencyContext(BaseModel):
    agency_id: int
    agency_name: str
    city: str
    current_season: str  # 'low', 'high', 'shoulder'
    
    fleet_status: FleetStatus
    recent_revenue: float
    
    top_performer_car: Optional[CarStats] = None
    worst_rated_car: Optional[CarStats] = None
    most_common_complaint: Optional[str] = None
    competitor_price_index: float = 1.0
    
    # Nouvelles métriques enrichies
    total_reservations: int = 0
    average_reservation_duration: float = 0
    client_satisfaction_rate: float = 0

class ChatMessage(BaseModel):
    role: str 
    content: str
    context: Optional[AgencyContext] = None 

# --- LOGIQUE D'ANALYSE IA ---

def generate_strategic_advice(ctx: AgencyContext) -> str:
    """
    Analyse avancée qui croise données financières, satisfaction client et performance.
    """
    advice_buffer = []
    
    # 1. Analyse du véhicule star (Vache à lait)
    if ctx.top_performer_car:
        top = ctx.top_performer_car
        if top.occupancy_days > 20:
            roi_per_day = top.total_revenue / max(top.occupancy_days, 1)
            advice_buffer.append(
                f"🏆 **Star du mois** : La **{top.model_name}** ({top.category}) est votre meilleure source de revenus.\n"
                f"💰 Revenue : {top.total_revenue:.0f}€ sur {top.occupancy_days} jours (ROI : {roi_per_day:.0f}€/jour)\n"
                f"⭐ Note : {top.average_rating:.1f}/5\n"
                f"**Action recommandée** : Augmentez son prix de 10-15% OU achetez 1-2 véhicules similaires."
            )
        elif top.occupancy_days < 10:
            advice_buffer.append(
                f"⚠️ **Sous-utilisation** : La {top.model_name} rapporte beaucoup ({top.total_revenue:.0f}€) mais n'est louée que {top.occupancy_days} jours.\n"
                f"Vérifiez si le prix ({top.price_per_hour:.0f}€/h) n'est pas trop élevé."
            )
    
    # 2. Gestion de la qualité (Véhicule problématique)
    if ctx.worst_rated_car and ctx.worst_rated_car.average_rating < 3.5:
        bad = ctx.worst_rated_car
        advice_buffer.append(
            f"🚨 **ALERTE QUALITÉ** : La **{bad.model_name}** plombe votre réputation !\n"
            f"❌ Note : {bad.average_rating:.1f}/5 ({bad.negative_reviews_count} plaintes)\n"
            f"💸 Coûts maintenance : {bad.maintenance_cost:.0f}€\n"
            f"**Action urgente** : Vérifiez l'état mécanique ou retirez-la temporairement. Chaque mauvais avis impacte votre visibilité Google."
        )
    
    # 3. Yield Management (Optimisation des prix)
    occupancy_rate = ctx.fleet_status.utilization_rate
    if occupancy_rate > 85:
        if ctx.competitor_price_index < 1.0:
            price_increase = (1.0 - ctx.competitor_price_index) * 100
            advice_buffer.append(
                f"💎 **OPPORTUNITÉ REVENUE** : Vous êtes à {occupancy_rate:.0f}% d'occupation et {price_increase:.0f}% moins cher que vos concurrents.\n"
                f"**Conseil** : Augmentez vos prix de 10-15% immédiatement. La demande est là, profitez-en !"
            )
        else:
            advice_buffer.append(
                f"✅ **Performance Optimale** : {occupancy_rate:.0f}% d'occupation avec des prix compétitifs. Continuez ainsi !"
            )
    elif occupancy_rate < 60:
        advice_buffer.append(
            f"📉 **Taux d'occupation faible** : Seulement {occupancy_rate:.0f}% de votre flotte est louée.\n"
            f"**Actions suggérées** :\n"
            f"- Lancez une promotion (-10-15%) sur les véhicules peu demandés\n"
            f"- Augmentez votre présence sur les plateformes de location\n"
            f"- Vérifiez vos photos et descriptions (attractivité)"
        )
    
    # 4. Analyse de la satisfaction client
    if ctx.client_satisfaction_rate < 70:
        advice_buffer.append(
            f"😟 **Satisfaction client** : {ctx.client_satisfaction_rate:.0f}%\n"
            f"Problème récurrent : {ctx.most_common_complaint or 'Non identifié'}\n"
            f"**Conseil** : Formation du personnel + checklist qualité avant chaque départ."
        )
    
    # 5. Durée moyenne des locations
    if ctx.average_reservation_duration < 2:
        advice_buffer.append(
            f"⏱️ **Locations courtes** : Durée moyenne {ctx.average_reservation_duration:.1f} jours.\n"
            f"**Stratégie** : Proposez des forfaits week-end attractifs pour augmenter la durée."
        )
    
    # Fallback si tout va bien
    if not advice_buffer:
        advice_buffer.append(
            f"✅ **Excellent travail** !\n"
            f"• Flotte : {ctx.fleet_status.total_cars} véhicules\n"
            f"• Occupation : {occupancy_rate:.0f}%\n"
            f"• Revenue récent : {ctx.recent_revenue:.0f}€\n\n"
            f"Continuez à surveiller vos avis clients et adaptez vos prix selon la demande."
        )
    
    return "\n\n".join(advice_buffer)

# --- ENDPOINTS ---

@app.get("/")
def health_check():
    return {
        "status": "active",
        "service": "RentFlow AI Advisor v2.0",
        "features": ["performance_analysis", "contextual_chat", "voice_synthesis"]
    }

@app.post("/api/analyze")
def analyze_agency_performance(context: AgencyContext):
    """
    Analyse complète et contextualisée de l'agence.
    """
    try:
        strategic_advice = generate_strategic_advice(context)
        
        # Synthèse vocale courte
        voice_msg = f"Analyse terminée pour {context.agency_name}."
        
        if context.worst_rated_car and context.worst_rated_car.average_rating < 3.0:
            voice_msg += f" Attention, la {context.worst_rated_car.model_name} reçoit de très mauvais avis."
        elif context.fleet_status.utilization_rate > 85:
            voice_msg += " Excellent taux d'occupation. Pensez à augmenter vos prix."
        elif context.fleet_status.utilization_rate < 60:
            voice_msg += " Le taux d'occupation est faible. Lancez une promotion."
        
        return {
            "agency": context.agency_name,
            "status": "success",
            "ai_analysis": strategic_advice,
            "voice_summary": voice_msg,
            "metrics": {
                "utilization_rate": context.fleet_status.utilization_rate,
                "recent_revenue": context.recent_revenue,
                "satisfaction_rate": context.client_satisfaction_rate
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
def chat_with_advisor(message: ChatMessage):
    """
    Chat contextuel avec l'IA advisor.
    """
    user_text = message.content.lower()
    ctx = message.context
    
    response_text = ""
    sentiment = "positive"
    
    if ctx:
        # Questions sur les performances
        if any(word in user_text for word in ["meilleur", "rapporte", "rentable", "top"]):
            if ctx.top_performer_car:
                top = ctx.top_performer_car
                response_text = (
                    f"💎 Sans hésitation, c'est la **{top.model_name}** !\n\n"
                    f"• Revenue : {top.total_revenue:.0f}€\n"
                    f"• Jours loués : {top.occupancy_days}\n"
                    f"• Note moyenne : {top.average_rating:.1f}/5\n\n"
                    f"Mon conseil : Mettez-la en avant sur votre page d'accueil avec un badge 'Véhicule populaire'."
                )
            else:
                response_text = "Je n'ai pas encore assez de données pour identifier votre meilleur véhicule."
        
        # Questions sur les avis clients
        elif any(word in user_text for word in ["avis", "note", "satisfaction", "client", "plainte"]):
            if ctx.worst_rated_car:
                bad = ctx.worst_rated_car
                response_text = (
                    f"⚠️ Attention à la **{bad.model_name}** : note de {bad.average_rating:.1f}/5.\n\n"
                    f"Problème principal : {ctx.most_common_complaint or 'Non spécifié'}\n\n"
                    f"Action : Inspectez ce véhicule et résolvez le problème rapidement. "
                    f"Les mauvais avis impactent directement votre taux de conversion."
                )
                sentiment = "warning"
            else:
                response_text = (
                    f"😊 Globalement, vos clients sont satisfaits ({ctx.client_satisfaction_rate:.0f}%).\n\n"
                    f"Continuez à maintenir ce niveau de qualité !"
                )
        
        # Questions sur les prix
        elif any(word in user_text for word in ["prix", "tarif", "augmenter", "baisser"]):
            occupancy = ctx.fleet_status.utilization_rate
            if occupancy > 85 and ctx.competitor_price_index < 1.0:
                response_text = (
                    f"💰 Vous êtes à {occupancy:.0f}% d'occupation ET moins cher que vos concurrents.\n\n"
                    f"**Vous perdez de l'argent !** Augmentez vos prix de 10-15% dès maintenant. "
                    f"La demande est là, profitez-en."
                )
            elif occupancy < 60:
                response_text = (
                    f"📉 Taux d'occupation : {occupancy:.0f}%\n\n"
                    f"Stratégie : Baissez temporairement vos prix de 10% sur les véhicules les moins demandés "
                    f"et lancez une campagne marketing."
                )
            else:
                response_text = (
                    f"✅ Vos prix sont bien calibrés (occupation : {occupancy:.0f}%).\n\n"
                    f"Surveillez quotidiennement et ajustez selon la demande."
                )
        
        # Questions sur la flotte
        elif any(word in user_text for word in ["flotte", "voiture", "véhicule", "acheter"]):
            response_text = (
                f"🚗 **Votre flotte** :\n\n"
                f"• Total : {ctx.fleet_status.total_cars} véhicules\n"
                f"• Disponibles : {ctx.fleet_status.available_cars}\n"
                f"• Taux d'utilisation : {ctx.fleet_status.utilization_rate:.0f}%\n\n"
            )
            if ctx.top_performer_car:
                response_text += f"Conseil : Investissez dans des véhicules type {ctx.top_performer_car.category}."
        
        # Questions marketing
        elif any(word in user_text for word in ["marketing", "pub", "promotion", "visibilité"]):
            response_text = (
                f"📢 **Stratégie Marketing** pour {ctx.city} :\n\n"
                f"1. Ciblez les gares et aéroports (flyers + QR codes)\n"
                f"2. Partenariats avec hôtels locaux\n"
                f"3. Google Ads ciblés 'location voiture {ctx.city}'\n"
                f"4. Instagram : Stories avec vos véhicules stars\n\n"
                f"Budget recommandé : 300-500€/mois"
            )
    
    # Réponses génériques
    if not response_text:
        if any(word in user_text for word in ["bonjour", "salut", "hello"]):
            response_text = (
                f"👋 Bonjour ! Je suis votre conseiller IA.\n\n"
                f"Je peux analyser vos performances, vos avis clients, vos prix, ou vous donner des conseils marketing.\n\n"
                f"Posez-moi une question précise sur votre agence !"
            )
        elif any(word in user_text for word in ["merci", "ok", "bien"]):
            response_text = "Avec plaisir ! N'hésitez pas si vous avez d'autres questions. 😊"
        else:
            response_text = (
                f"🤔 Je peux vous aider avec :\n\n"
                f"• Analyse de performance\n"
                f"• Conseils sur les prix\n"
                f"• Gestion des avis clients\n"
                f"• Stratégie marketing\n\n"
                f"Reformulez votre question pour que je puisse mieux vous aider."
            )
    
    return {
        "reply": response_text,
        "sentiment": sentiment
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
